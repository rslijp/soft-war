import {COMMANDS, GameView, MessageBus, ViewUnit, currentBus, gameHost, runWithBus} from "softwar-shared";

// Events whose arguments describe units; the screen gets ViewUnits for them.
const UNIT_ARGUMENTS = {
    "battle-results": [0, 1],
    "unit-order-attention": [0],
    "confirm-order": [0],
    "unit-out-of-fuel": [0]
};

// The screen's end of a game: the commands the screen sends on its bus go to the game, and what
// the game sends back arrives on the screen's bus as "event:<name>" (and "screen-update" for a new
// snapshot). sendCommand delivers a command to wherever the game runs.
export function screenConnection(sendCommand) {
    let gameView = null;
    let resolveReady;
    const ready = new Promise(resolve => resolveReady = resolve);
    const handles = Object.keys(COMMANDS).map(name =>
        MessageBus.register(name, (...args) => sendCommand(name, args), this));
    // a local game calls back while its own bus is active; what it says belongs on the screen's bus
    const screenBus = currentBus();

    function receive(message) {
        runWithBus(screenBus, () => deliver(message));
    }

    function deliver(message) {
        if (message.type === "map") {
            // after reconnecting the map comes again; it never changes, so the screen keeps its model
            if (!gameView) gameView = new GameView(message.map);
        } else if (message.type === "view") {
            gameView.update(message.view);
            resolveReady(gameView);
            MessageBus.send("screen-update");
        } else if (message.type === "event") {
            // the game is carrying out orders: keys are ignored meanwhile, as before
            if (message.name === "bus-locked") return MessageBus.lock();
            if (message.name === "bus-unlocked") return MessageBus.unlock();
            const args = [...message.args];
            (UNIT_ARGUMENTS[message.name] || []).forEach(i => args[i] = args[i] && new ViewUnit(args[i]));
            MessageBus.send("event:" + message.name, ...args);
        }
    }

    return {
        ready,
        receive,
        close: () => MessageBus.revokeByHandles(handles)
    };
}

let running = null;

// The game page calls this when it shows the running game; the returned function when it goes away.
// Then the local game stops, or the connection to the server hangs up. (Waiting a moment lets
// React's development mode unmount and mount the page again without hanging up.)
export function watchGame() {
    const game = running;
    if (!game) return () => {};
    game.pages = (game.pages || 0) + 1;
    return () => {
        game.pages -= 1;
        setTimeout(() => {
            if (game.pages === 0 && running === game) {
                running.stop();
                running = null;
            }
        }, 0);
    };
}

// A game that runs on the server: commands go up the WebSocket, its messages come down. When the
// connection breaks (or the server says the game changed, 4001), it connects again and the screen
// keeps going with the fresh state. The server refusing (no such game any more, not your game) ends it.
export function remoteGame(code) {
    if (running) running.stop();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/game-socket?code=${encodeURIComponent(code)}`;
    let socket = null;
    let stopped = false;
    let retries = 0;
    let rejectStart;
    const started = new Promise((resolve, reject) => rejectStart = reject);
    const pending = [];
    const connection = screenConnection((name, args) => {
        const message = JSON.stringify({type: "command", name, args});
        if (socket && socket.readyState === WebSocket.OPEN) socket.send(message);
        else pending.push(message);
    });

    function connect() {
        socket = new WebSocket(url);
        socket.addEventListener("open", () => {
            retries = 0;
            pending.splice(0).forEach(m => socket.send(m));
            MessageBus.send("event:connection-open");
        });
        socket.addEventListener("message", (event) => connection.receive(JSON.parse(event.data)));
        socket.addEventListener("close", (event) => {
            if (stopped) return;
            const refused = event.code >= 4000 && event.code !== 4001;
            if (refused) {
                stopped = true;
                MessageBus.send("event:game-closed", event.code, event.reason);
                rejectStart(new Error(event.reason || "The game is not available"));
                return;
            }
            MessageBus.send("event:connection-lost");
            const wait = event.code === 4001 ? 0 : Math.min(10000, 500 * 2 ** retries++);
            setTimeout(() => !stopped && connect(), wait);
        });
    }
    connect();

    running = {stop: () => {
        stopped = true;
        connection.close();
        if (socket) socket.close();
    }};
    return Promise.race([connection.ready, started]).then(gameView => ({gameView}));
}

// A game that runs in this browser (against the AI, or the dev game): the same host the server
// uses, with the messages copied as JSON so they are exactly what a network would carry.
export function localGame(createEngineGame, {onTurnEnded} = {}) {
    if (running) running.stop();
    let connection = null;
    const host = gameHost(createEngineGame, {onTurnEnded, debugView: () => !!host.game.debugView});
    const screen = {send: (message) => connection.receive(JSON.parse(JSON.stringify(message)))};
    connection = screenConnection((name, args) => host.command(screen, name, JSON.parse(JSON.stringify(args))));
    host.attach(screen);
    running = {stop: () => {
        connection.close();
        host.stop();
    }};
    return connection.ready.then(gameView => {
        gameView.onDebugView = (on) => {
            host.game.debugView = on;
            host.refresh();
        };
        return {gameView, host};
    });
}
