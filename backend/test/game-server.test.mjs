import {after, before, test} from "node:test";
import {generateMap, generatePlayerList} from "softwar-shared/services/map-service.mjs";
import WebSocket from "ws";
import assert from "node:assert/strict";
import {gameServer} from "../game-server.mjs";
import http from "node:http";

// An in-memory "database" with one game: a human (one@example.com) against the AI.
function newGame(code, emails) {
    let world, players;
    while (!players) {
        world = generateMap("REGULAR", 48, 48);
        try {
            players = generatePlayerList({email: emails[0], name: "One"}, emails.slice(1), world);
        } catch (e) {
            players = null;
        }
    }
    players.forEach(p => p.status = "accepted");
    return {code, name: code, at: Date.now(), turn: 1, currentPlayer: 0, players, map: world, status: "active"};
}

const stored = new Map();
const saves = [];
const turnStarts = [];
let server, port, games;

before(async () => {
    stored.set("vsai", newGame("vsai", ["one@example.com", ""]));
    stored.set("duel", newGame("duel", ["one@example.com", "two@example.com"]));
    stored.set("letter", newGame("letter", ["one@example.com", "two@example.com"]));
    stored.set("changed", newGame("changed", ["one@example.com", "two@example.com"]));
    games = gameServer({
        findGame: async (code) => stored.has(code) ? structuredClone(stored.get(code)) : null,
        saveGame: async (code, state) => {
            saves.push({code, turn: state.turn});
            stored.set(code, structuredClone(state));
        },
        unloadAfter: 50,
        onTurnEnded: (game, running) => turnStarts.push({code: game.code, player: game.currentPlayerIndex, watching: running.isWatching(game.currentPlayerIndex)})
    });
    server = http.createServer();
    // the "session": who you are comes from the ?as= query parameter
    games.attach(server, async (request) => new URL(request.url, "http://x").searchParams.get("as"));
    await new Promise(resolve => server.listen(0, resolve));
    port = server.address().port;
});

after(() => new Promise(resolve => server.close(resolve)));

function open(code, as) {
    const socket = new WebSocket(`ws://localhost:${port}/api/game-socket?code=${code}&as=${as || ""}`);
    const messages = [];
    const waiters = [];
    socket.on("message", (data) => {
        messages.push(JSON.parse(data));
        waiters.splice(0).forEach(check => check());
    });
    const until = (predicate, timeout = 2000) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timed out")), timeout);
        const check = () => {
            const found = messages.find(predicate);
            if (found) {
                clearTimeout(timer);
                resolve(found);
            } else waiters.push(check);
        };
        check();
    });
    const closed = new Promise(resolve => socket.on("close", (code) => resolve(code)));
    const command = (name, ...args) => socket.send(JSON.stringify({type: "command", name, args}));
    return {socket, messages, until, closed, command};
}

test("a player gets the map and their own view", async () => {
    const screen = open("vsai", "one@example.com");
    const map = await screen.until(m => m.type === "map");
    const view = await screen.until(m => m.type === "view");
    assert.equal(map.map.dimensions.width, 48);
    assert.equal(view.view.viewer, 0);
    assert.ok(view.view.units.some(u => u.player === 0 && u.clazz === "city"));
    screen.socket.close();
    await screen.closed;
});

test("strangers, unknown games and missing logins are refused", async () => {
    assert.equal(await open("vsai", "stranger@example.com").closed, 4403);
    assert.equal(await open("nope", "one@example.com").closed, 4404);
    const anonymous = open("vsai", "");
    await assert.rejects(new Promise((resolve, reject) => {
        anonymous.socket.on("open", resolve);
        anonymous.socket.on("error", reject);
    }));
});

test("the AI plays its turn on the server and the game is saved", async () => {
    const screen = open("vsai", "one@example.com");
    await screen.until(m => m.type === "view");
    screen.command("next-turn");
    // the AI plays and hands the turn back: the human's next turn starts
    await screen.until(m => m.type === "event" && m.name === "new-turn", 5000);
    assert.ok(saves.some(s => s.code === "vsai" && s.turn === 2));
    screen.socket.close();
    await screen.closed;
    // nobody watches any more: saved once more and unloaded
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(games.running("vsai"), undefined);
    assert.equal(stored.get("vsai").turn, 2);
});

test("only the player whose turn it is can act", async () => {
    const one = open("duel", "one@example.com");
    const two = open("duel", "two@example.com");
    await one.until(m => m.type === "view");
    await two.until(m => m.type === "view" && m.view.viewer === 1);

    two.command("next-turn");
    await new Promise(resolve => setTimeout(resolve, 100));
    const running = await games.running("duel");
    assert.equal(running.host.game.currentPlayerIndex, 0);

    one.command("next-turn");
    await two.until(m => m.type === "event" && m.name === "new-turn");
    assert.equal(running.host.game.currentPlayerIndex, 1);
    assert.equal(one.messages.filter(m => m.type === "event" && m.name === "new-turn").length, 0);

    one.socket.close();
    two.socket.close();
    await Promise.all([one.closed, two.closed]);
});

test("the turn hook knows when the next player isn't watching (for the your-turn email)", async () => {
    const one = open("letter", "one@example.com");
    await one.until(m => m.type === "view");
    one.command("next-turn");
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.deepEqual(turnStarts.find(t => t.code === "letter"), {code: "letter", player: 1, watching: false});
    one.socket.close();
    await one.closed;
});

test("screens reconnect to a game that changed elsewhere", async () => {
    const one = open("changed", "one@example.com");
    await one.until(m => m.type === "view");

    // e.g. a surrender: the running game is saved and stopped, the database changes
    await games.close("changed");
    assert.equal(await one.closed, 4001);
    const state = stored.get("changed");
    state.players[1].status = "surrendered";

    const again = open("changed", "one@example.com");
    const view = await again.until(m => m.type === "view");
    assert.equal(view.view.players[1].state, "lost");
    again.socket.close();
    await again.closed;
});
