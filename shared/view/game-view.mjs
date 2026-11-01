// A screen's model of a game it doesn't run itself: built from the snapshots of services/player-view.mjs.
// It offers the read methods the screen already used on the engine's objects (getName, canMove,
// definition, ...), so drawing a game doesn't need the game engine, only what its player may see.
import {decorateMap} from "./world-map.mjs";
import {gameMap} from "../game/game-map.mjs";
import {unitTypes} from "../game/unit-types.mjs";

const key = (at) => `${at.y}_${at.x}`;

// A unit or city from a snapshot (see describeUnit in services/player-view.mjs).
export function ViewUnit(data) {
    const {nested, remark, specialAction, canFortify, ...fields} = data;
    Object.assign(this, fields);
    this.position = {x: data.at.x, y: data.at.y};
    this.nestedUnits = (nested || []).map(n => new ViewUnit(n));
    if (this.clazz === "unit" && this.capacity === undefined) this.capacity = (unitTypes[this.type] || {}).capacity;
    this.remarkText = remark || null;
    // like on the engine's units, these only exist where they apply
    if (specialAction) this.specialAction = () => specialAction;
    if (canFortify !== undefined) this.canFortify = () => !!canFortify;
}
ViewUnit.prototype.derivedPosition = function() {
    return {x: this.at.x, y: this.at.y};
};
ViewUnit.prototype.isOn = function(at) {
    return this.at.x === at.x && this.at.y === at.y;
};
ViewUnit.prototype.getName = function() {
    return this.name;
};
ViewUnit.prototype.getShortName = function() {
    return this.shortName;
};
ViewUnit.prototype.isAlive = function() {
    return this.health === undefined || this.health > 0;
};
ViewUnit.prototype.canMove = function() {
    return this.clazz === "unit" && this.isAlive() && this.movesLeft > 0;
};
ViewUnit.prototype.remark = function() {
    return this.remarkText;
};
ViewUnit.prototype.definition = function() {
    return this.clazz === "unit" ? unitTypes[this.type] : undefined;
};
ViewUnit.prototype.producing = function() {
    return this.producingType ? unitTypes[this.producingType] : null;
};
ViewUnit.prototype.canMoveOn = function(type) {
    const definition = unitTypes[this.type];
    return !!definition && definition.allowed.indexOf(type) > -1;
};
// the same rules as unit.canLoad and city.canLoad, on the data a screen has
ViewUnit.prototype.canLoad = function(unit, ignoreMoves) {
    if (this.clazz === "city") {
        return this.nestedUnits.length < (this.capacity || 0) && (ignoreMoves || unit.canMove()) && unit.player === this.player;
    }
    const definition = unitTypes[this.type];
    if (!definition || !definition.canLoadUnits || definition.canLoadUnits.indexOf(unit.type) === -1) return false;
    if (this.nestedUnits.length >= definition.capacity) return false;
    if (!ignoreMoves && !unit.canMove()) return false;
    return unit.player === this.player;
};

function fogOf(rows) {
    const at = (position) => rows[position.y] ? rows[position.y][position.x] : "0";
    return {
        discovered: (position) => at(position) !== "0",
        visible: (position) => at(position) === "2"
    };
}

// The game as a screen sees it. update() takes a new snapshot; the object itself stays the same,
// so the page can keep it.
export function GameView(map) {
    const raw = {dimensions: map.dimensions, world: map.world.slice(), cities: map.cities};
    const terrain = new gameMap(raw);
    const world = terrain.world();
    decorateMap({dimensions: terrain.dimensions, world: world.world});
    let snapshot = null;
    let byPosition = new Map();
    let unitsByRef = new Map();

    this.debugView = false;
    this.map = terrain;
    // the debug view (the AI seen through its own eyes) only exists for a game running in this browser
    this.setDebugView = (on) => {
        if (this.debugView === on) return;
        this.debugView = on;
        if (this.onDebugView) this.onDebugView(on);
    };

    const playerOf = (index) => {
        const p = snapshot.players[index];
        const viewer = snapshot.viewer;
        return {
            ...p,
            fogOfWar: fogOf(snapshot.fog),
            selectedUnit: index === snapshot.currentPlayer && index === viewer && snapshot.selected
                ? this.findUnit(snapshot.selected) : null,
            position: index === viewer ? snapshot.position : null
        };
    };

    this.update = (next) => {
        snapshot = next;
        byPosition = new Map();
        unitsByRef = new Map();
        const index = (unit, top) => {
            unitsByRef.set(`${unit.clazz}:${unit.player}:${unit.id}`, unit);
            if (top) {
                const existing = byPosition.get(key(unit.at));
                // a city stays on top of the units in it
                if (!existing || unit.clazz === "city") byPosition.set(key(unit.at), unit);
            }
            unit.nestedUnits.forEach(n => index(n, false));
        };
        next.units.map(u => new ViewUnit(u)).forEach(u => index(u, true));
        // goes up with every snapshot, so a screen can tell a new snapshot from a redraw
        this.version = (this.version || 0) + 1;
        this.code = next.code;
        this.name = next.name;
        this.turn = next.turn;
        this.currentPlayerIndex = next.currentPlayer;
        this.viewer = next.viewer;
        this.players = next.players.map((p, i) => playerOf(i));
        return this;
    };

    // every unit and city this screen knows of, also the ones inside cities and transports
    this.units = () => [...unitsByRef.values()];
    this.findUnit = (ref) => ref ? unitsByRef.get(`${ref.clazz}:${ref.player}:${ref.id}`) || null : null;
    this.player = (index) => playerOf(index);
    this.currentPlayer = () => playerOf(snapshot.currentPlayer);
    this.spectator = () => playerOf(snapshot.viewer);
    this.position = (backup) => snapshot.position || backup || {x: 0, y: 0};
    this.dimensions = () => terrain.dimensions;
    this.world = () => ({
        gameMap: terrain,
        dimensions: terrain.dimensions,
        world: world.world,
        unitAt: (at) => byPosition.get(key(at)) || null,
        normalize: terrain.normalize,
        intelligence: snapshot.intelligence
    });
}
