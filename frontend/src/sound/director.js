// Decides when which sound plays: on clicks, on what the game tells the screen, and on what changed
// between two snapshots of the game (a unit that moved, a city taken, an enemy coming into sight).
import {MessageBus} from "softwar-shared";
import {play} from "./audio";
import {setMood} from "./music";

const AIR = ["F", "B", "H", "m"];
const SEA = ["D", "c", "A", "S", "t", "b"];
const moveSound = (type) => AIR.includes(type) ? "move-air" : SEA.includes(type) ? "move-sea" : "move-land";
const key = (unit) => `${unit.clazz}:${unit.player}:${unit.id}`;
const where = (unit) => `${unit.at.y}_${unit.at.x}`;

// Buttons, links and menu items click, anywhere in the app.
export function installClickSounds() {
    document.addEventListener("click", (event) => {
        if (event.target.closest && event.target.closest("button, a, .dropdown-item, .nested-unit-slot")) play("click");
    }, true);
}

// The sounds of one game page. Returns the function that stops them.
export function gameSounds(gameState) {
    let previous = null;
    let pendingMove = null;
    setMood("march");

    // what the screen knows now, in a form that is easy to compare
    function take() {
        const viewer = gameState.viewer;
        const units = gameState.units();
        const selected = gameState.currentPlayer().selectedUnit;
        return {
            version: gameState.version,
            turn: gameState.turn,
            selected: selected ? {key: key(selected), at: where(selected), movesLeft: selected.movesLeft} : null,
            own: new Map(units.filter(u => u.player === viewer && u.clazz === "unit").map(u => [key(u), {at: where(u), type: u.type}])),
            cities: new Set(units.filter(u => u.player === viewer && u.clazz === "city").map(u => u.id)),
            enemies: new Map(units.filter(u => u.player !== viewer && u.player !== null && u.clazz === "unit").map(u => [key(u), where(u)]))
        };
    }

    function compare() {
        if (!gameState.version || (previous && previous.version === gameState.version)) return;
        const now = take();
        const before = previous;
        previous = now;
        if (!before) return;

        // a city taken or lost
        if (now.cities.size > before.cities.size) play("city-taken", {minGap: 1});
        else if (now.cities.size < before.cities.size) play("city-lost", {minGap: 1});

        // my units: one that moved (the selected one first), or a new one from a city
        let moved = null;
        now.own.forEach((unit, id) => {
            const was = before.own.get(id);
            if (was && was.at !== unit.at && (!moved || (now.selected && now.selected.key === id))) moved = unit;
        });
        const produced = now.turn === before.turn ? 0 : [...now.own.keys()].filter(id => !before.own.has(id)).length;
        if (moved) play(moveSound(moved.type), {minGap: 0.12});
        else if (produced > 0) play("produced", {minGap: 0.5});

        // a key press that didn't move the selected unit
        if (pendingMove && now.selected && now.selected.key === pendingMove.key && now.selected.at === pendingMove.at
            && now.selected.movesLeft === pendingMove.movesLeft) {
            play("blocked");
        }
        pendingMove = null;

        // picking another unit
        if (now.selected && (!before.selected || before.selected.key !== now.selected.key) && !moved) play("select");

        // the enemy: coming into sight, or moving within it
        const appeared = [...now.enemies.keys()].some(id => !before.enemies.has(id));
        const enemyMoved = [...now.enemies].some(([id, at]) => before.enemies.has(id) && before.enemies.get(id) !== at);
        if (appeared) play("spotted", {minGap: 2.5});
        else if (enemyMoved) play("enemy-move", {minGap: 0.15});
    }

    const handles = [
        MessageBus.register("screen-update", compare, this),
        MessageBus.register("event:new-turn", () => {
            play("your-turn", {minGap: 1});
            play("paper");
        }, this),
        MessageBus.register("event:battle-results", (attacker, defender) => {
            play("battle", {minGap: 0.5});
            const mine = attacker.player === gameState.viewer ? attacker : defender;
            play(mine.isAlive() ? "victory" : "defeat", {minGap: 0.5});
        }, this),
        MessageBus.register("event:propose-end-turn", () => play("end-turn", {minGap: 1}), this),
        MessageBus.register("event:unit-order-attention", () => play("attention", {minGap: 1}), this),
        MessageBus.register("event:unit-out-of-fuel", () => play("out-of-fuel", {minGap: 1}), this),
        MessageBus.register("event:confirm-order", () => play("paper"), this),
        MessageBus.register("move-to-mode", () => play("order-mode"), this),
        MessageBus.register("patrol-to-mode", () => play("order-mode"), this),
        MessageBus.register("give-order", (action, path, direction, confirmed) => confirmed && play("order"), this),
        MessageBus.register("cursor-direction", () => {
            const selected = gameState.currentPlayer().selectedUnit;
            pendingMove = selected ? {key: key(selected), at: where(selected), movesLeft: selected.movesLeft} : null;
        }, this)
    ];
    previous = gameState.version ? take() : null;

    return () => {
        MessageBus.revokeByHandles(handles);
        setMood("calm");
    };
}
