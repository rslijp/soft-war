// Runs games on the server and connects the players' screens to them over WebSockets.
//
// A screen opens /api/game-socket?code=<game>. The player is the one logged in (the express session
// cookie comes along with the upgrade request). The game is loaded from MongoDB when its first screen
// connects, runs here (the AI included) and is saved after every turn; when nobody has watched it for a
// while it is saved and unloaded.
//
// Screen -> server: {type: "command", name, args}
// Server -> screen: the host's messages (map, view, event; see softwar-shared/services/game-host.mjs)
import {WebSocketServer} from "ws";
import {deserializeGameState, serializeGameState} from "softwar-shared/services/save-game.mjs";
import {gameHost} from "softwar-shared/services/game-host.mjs";

const UNLOAD_AFTER = 10 * 60 * 1000;
const SOCKET_PATH = "/api/game-socket";

export function gameServer({findGame, saveGame, onTurnEnded = () => {}, unloadAfter = UNLOAD_AFTER}) {
    const games = new Map(); // code -> Promise of a running game

    function open(code) {
        if (!games.has(code)) {
            const loading = findGame(code).then(state => {
                if (!state) {
                    games.delete(code);
                    return null;
                }
                const running = {code, state, screens: new Set(), idle: null};
                running.host = gameHost(() => deserializeGameState(state), {
                    onTurnEnded: (game) => {
                        save(running);
                        onTurnEnded(game, running.state);
                    }
                });
                return running;
            }).catch(e => {
                games.delete(code);
                throw e;
            });
            games.set(code, loading);
        }
        return games.get(code);
    }

    function save(running) {
        const state = {...serializeGameState(running.host.game), status: running.state.status || "active"};
        // keep what only the stored game knows, like who accepted the invitation
        state.players.forEach((p, i) => {
            const stored = running.state.players[i] || {};
            p.status = stored.status || p.status;
        });
        return saveGame(running.code, state).catch(e => console.error("Saving game " + running.code + " failed", e));
    }

    function unload(running) {
        games.delete(running.code);
        return save(running).then(() => running.host.stop());
    }

    async function connect(socket, code, email) {
        const running = await open(code);
        if (!running) return socket.close(4404, "No such game");
        const player = running.state.players.findIndex(p => p.id === email);
        if (player < 0) return socket.close(4403, "You don't play in this game");

        clearTimeout(running.idle);
        const screen = {
            player,
            send: (message) => {
                if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
            }
        };
        running.screens.add(screen);
        running.host.attach(screen);

        socket.on("message", (data) => {
            let message;
            try {
                message = JSON.parse(data);
            } catch (e) {
                return;
            }
            if (message && message.type === "command" && typeof message.name === "string") {
                running.host.command(screen, message.name, Array.isArray(message.args) ? message.args : []);
            }
        });
        socket.on("close", () => {
            running.host.detach(screen);
            running.screens.delete(screen);
            if (running.screens.size === 0) {
                running.idle = setTimeout(() => unload(running), unloadAfter);
            }
        });
    }

    // Hooks the WebSocket endpoint into the HTTP server. sessionOf(request) resolves to the logged-in
    // user's email, or nothing.
    function attach(server, sessionOf) {
        const sockets = new WebSocketServer({noServer: true});
        server.on("upgrade", (request, socket, head) => {
            const url = new URL(request.url, "http://localhost");
            if (url.pathname !== SOCKET_PATH) return;
            sessionOf(request).then(email => {
                if (!email) {
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    return socket.destroy();
                }
                sockets.handleUpgrade(request, socket, head, (ws) => {
                    connect(ws, url.searchParams.get("code"), email).catch(e => {
                        console.error("Opening game failed", e);
                        ws.close(4500, "Opening the game failed");
                    });
                });
            });
        });
        return sockets;
    }

    return {
        attach,
        connect,
        // Save a running game and stop it, before something else changes it in the database
        // (surrender, accepting an invitation). Its next screen loads it again.
        close: (code) => {
            const loading = games.get(code);
            return loading ? loading.then(running => running && unload(running)) : Promise.resolve();
        },
        running: (code) => games.get(code),
        saveAll: () => Promise.all([...games.values()].map(p => p.then(running => running && save(running))))
    };
}
