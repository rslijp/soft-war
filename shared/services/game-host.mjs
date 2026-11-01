// Hosts one running game for the screens that watch it: in the browser (a local game) or on the
// server (a game over WebSockets). The game runs on its own message bus; screens only send it
// COMMANDS and get back, per screen, the events and snapshots meant for that screen's player.
//
// Messages to a screen: {type: "map", map}, {type: "view", view}, {type: "event", name, args}.
import {createMessageBus, runWithBus} from "./message-service.mjs";
import {describeOrder, describeMap, describeUnit, playerView} from "./player-view.mjs";
import {COMMANDS} from "./commands.mjs";

// commands that the bus drops while an order is being carried out (like keys used to be)
const LOCKABLE = new Set(["cursor-direction", "cursor-select", "special-action", "next-unit"]);

export function gameHost(createGame, {onTurnEnded, debugView = () => false} = {}) {
    const bus = createMessageBus();
    const game = runWithBus(bus, createGame);
    // a game saved while the player to move had surrendered continues with the next player
    if (game.currentPlayer().hasLost()) runWithBus(bus, () => bus.send("next-turn"));
    const screens = new Set();
    let flushScheduled = false;

    // A screen watches as one player ({player: index}) or, for a local game, as whoever
    // game.spectator() says (the human, or the AI itself in the debug view).
    const viewerOf = (screen) => screen.player !== undefined ? screen.player : game.spectator().index;
    const canSee = (screen, at) => {
        const viewer = game.player(viewerOf(screen));
        return viewerOf(screen) === game.currentPlayerIndex || (at && viewer.fogOfWar.visible(at));
    };
    const toPlayer = (index, name, ...args) => screens.forEach(s => {
        if (viewerOf(s) === index) s.send({type: "event", name, args});
    });
    const toCurrent = (name, ...args) => toPlayer(game.currentPlayerIndex, name, ...args);
    const focus = (at) => {
        if (!at) return;
        screens.forEach(s => canSee(s, at) && s.send({type: "event", name: "focus", args: [{x: at.x, y: at.y}]}));
    };

    function view(screen) {
        const viewer = viewerOf(screen);
        return playerView(game, viewer, {intelligence: debugView() && game.player(viewer).type === "AI"});
    }

    // Snapshots are sent once after a burst of events, not after every event.
    function changed() {
        if (flushScheduled) return;
        flushScheduled = true;
        setTimeout(() => {
            flushScheduled = false;
            screens.forEach(s => s.send({type: "view", view: view(s)}));
        }, 0);
    }

    const events = {
        "new-turn": (messages, playerIndex) => {
            toPlayer(playerIndex === undefined ? game.currentPlayerIndex : playerIndex, "new-turn", messages || []);
            if (onTurnEnded && playerIndex !== undefined) onTurnEnded(game);
        },
        "screen-update": (position) => focus(position),
        "unit-order-step": (unit) => unit && unit.health > 0 && focus(unit.derivedPosition()),
        "unit-selected": (unit) => unit && focus(unit.derivedPosition()),
        "battle-results": (attacker, defender, result) =>
            toPlayer(attacker.player, "battle-results", describeUnit(attacker, true), describeUnit(defender, false),
                {rounds: result.rounds, attackerBonus: result.attackerBonus, defenderBonus: result.defenderBonus}),
        "unit-order-attention": (unit, order) => toPlayer(unit.player, "unit-order-attention", describeUnit(unit, true), describeOrder(order)),
        "confirm-order": (unit, order) => toPlayer(unit.player, "confirm-order", describeUnit(unit, true), describeOrder(order)),
        "unit-out-of-fuel": (unit) => toPlayer(unit.player, "unit-out-of-fuel", describeUnit(unit, true)),
        "propose-end-turn": () => {
            // the AI ends its turn itself; a human gets the question
            if (game.currentPlayer().type === "AI") bus.send("next-turn");
            else toCurrent("propose-end-turn");
        },
        "bus-locked": () => toCurrent("bus-locked"),
        "bus-unlocked": () => toCurrent("bus-unlocked"),
        "player-wins": (player) => screens.forEach(s => s.send({type: "event", name: "player-wins", args: [player.index]})),
        "player-looses": (player) => screens.forEach(s => s.send({type: "event", name: "player-looses", args: [player.index]}))
    };
    runWithBus(bus, () => {
        // telling the screens must never break the game itself
        Object.entries(events).forEach(([name, handler]) => bus.register(name, (...args) => {
            try {
                handler(...args);
            } catch (e) {
                console.error("Could not tell the screens about " + name, e);
            }
            changed();
        }, null, true));
        // anything else that happens in the game also needs a new snapshot
        ["infobar-update", "move-unit", "unit-created", "unit-destroyed", "next-turn", "order-given", "unit-loaded"]
            .forEach(name => bus.register(name, changed, null, true));
    });

    return {
        game,
        bus,
        attach(screen) {
            screens.add(screen);
            screen.send({type: "map", map: describeMap(game)});
            screen.send({type: "view", view: view(screen)});
        },
        detach(screen) {
            screens.delete(screen);
        },
        // A command from a screen. A screen that plays as one player can only act in its own turn.
        command(screen, name, args = []) {
            if (!COMMANDS[name]) return false;
            if (screen.player !== undefined && screen.player !== game.currentPlayerIndex) return false;
            runWithBus(bus, () => LOCKABLE.has(name) ? bus.sendLockable(name, ...args) : bus.send(name, ...args));
            changed();
            return true;
        },
        refresh: changed,
        stop() {
            screens.clear();
            bus.registrations = {};
        }
    };
}
