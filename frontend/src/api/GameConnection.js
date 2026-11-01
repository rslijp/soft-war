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
            gameView = new GameView(message.map);
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

// A game that runs on the server: commands go up the WebSocket, its messages come down.
export function remoteGame(code) {
    if (running) running.stop();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/game-socket?code=${encodeURIComponent(code)}`);
    const pending = [];
    const connection = screenConnection((name, args) => {
        const message = JSON.stringify({type: "command", name, args});
        if (socket.readyState === WebSocket.OPEN) socket.send(message);
        else pending.push(message);
    });
    socket.addEventListener("open", () => pending.splice(0).forEach(m => socket.send(m)));
    socket.addEventListener("message", (event) => connection.receive(JSON.parse(event.data)));
    const failed = new Promise((resolve, reject) => socket.addEventListener("close", (event) => {
        // 4xxx: the server refused (no such game, not your game); otherwise the connection broke
        MessageBus.send("event:connection-closed", event.code, event.reason);
        reject(new Error(event.reason || "The connection to the game was closed"));
    }));
    running = {stop: () => {
        connection.close();
        socket.close();
    }};
    return Promise.race([connection.ready, failed]).then(gameView => ({gameView}));
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
