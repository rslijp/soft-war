// What one player may know about a game, as plain data: the snapshot a player's screen renders.
// Only units within the player's sight are in it, so a screen can't see more than its player.

// An order without the engine objects it collects while running (order.foes holds units).
export function describeOrder(order) {
    if (!order) return null;
    const result = {action: order.action};
    ["from", "to", "direction", "index", "reverse"].forEach(key => {
        if (order[key] !== undefined) result[key] = order[key];
    });
    if (order.queue) result.queue = order.queue.map(p => ({...p}));
    return result;
}

// A unit or city as plain data. Owners see everything about their own units; others see what is
// visible from the outside.
export function describeUnit(unit, own = true) {
    if (!unit) return null;
    const at = unit.derivedPosition();
    const result = {
        clazz: unit.clazz,
        type: unit.type,
        id: unit.id,
        player: unit.player,
        at: {x: at.x, y: at.y},
        name: unit.getName(),
        // a city's defence in a battle is a small object of its own, without a short name
        shortName: unit.getShortName ? unit.getShortName() : unit.getName(),
        health: unit.health
    };
    if (unit.clazz !== "unit") {
        if (own) {
            result.producingType = unit.producingType;
            result.production = unit.production;
            result.capacity = unit.capacity;
            result.nested = (unit.nestedUnits || []).map(n => describeUnit(n, true));
        }
        return result;
    }
    if (own) {
        const remark = unit.remark ? unit.remark() : null;
        result.movesLeft = unit.movesLeft;
        result.blitzed = !!unit.blitzed;
        if (unit.fuel !== undefined) result.fuel = unit.fuel;
        result.order = describeOrder(unit.order);
        result.fortified = !!unit.fortified;
        result.remark = remark || null;
        result.specialAction = unit.specialAction ? unit.specialAction() : null;
        result.canFortify = unit.canFortify ? unit.canFortify() : false;
        result.nested = (unit.nestedUnits || []).map(n => describeUnit(n, true));
    }
    return result;
}

// The AI's intelligence clusters (shown in the debug view) as sets of "y_x" keys.
function describeIntelligence(intelligence) {
    const keys = (map) => map ? Object.fromEntries(Object.keys(map).map(k => [k, true])) : null;
    return (intelligence || []).map(cluster => ({
        enemyCities: keys(cluster.enemyCities),
        enemyUnits: keys(cluster.enemyUnits),
        friendlyCities: keys(cluster.friendlyCities),
        friendlyUnits: keys(cluster.friendlyUnits),
        landmass: keys(cluster.landmass),
        undiscovered: keys(cluster.undiscovered)
    }));
}

// The map without anything on it: sent once to a screen, as in a saved game.
export function describeMap(game) {
    const map = game.map;
    const {width, height} = map.dimensions;
    const world = [];
    for (let y = 0; y < height; y++) {
        let row = "";
        for (let x = 0; x < width; x++) row += map.type({x, y});
        world.push(row);
    }
    return {dimensions: {width, height}, world, cities: map.cities.map(c => [c.position.y, c.position.x])};
}

export function playerView(game, viewer, {intelligence = false} = {}) {
    const player = game.player(viewer);
    const fog = player.fogOfWar;
    const {width, height} = game.map.dimensions;

    // per tile: 0 undiscovered, 1 discovered but out of sight, 2 in sight
    const fogRows = [];
    for (let y = 0; y < height; y++) {
        let row = "";
        for (let x = 0; x < width; x++) {
            const at = {x, y};
            row += !fog.discovered(at) ? "0" : fog.visible(at) ? "2" : "1";
        }
        fogRows.push(row);
    }
    const visible = (at) => fogRows[at.y][at.x] === "2";
    const discovered = (at) => fogRows[at.y][at.x] !== "0";

    const units = [];
    game.players.forEach(owner => {
        owner.units
            .filter(u => u.clazz === "unit" && !u.inside && u.health > 0)
            .forEach(u => {
                if (owner.index === viewer) units.push(describeUnit(u, true));
                else if (visible(u.derivedPosition())) units.push(describeUnit(u, false));
            });
    });
    game.map.cities.forEach(c => {
        const at = c.derivedPosition();
        if (c.player === viewer) units.push(describeUnit(c, true));
        else if (visible(at)) units.push(describeUnit(c, false));
        // out of sight you remember where a city is, not who holds it
        else if (discovered(at)) units.push({...describeUnit(c, false), player: null});
    });

    const current = game.currentPlayer();
    const selected = current.index === viewer && current.selectedUnit && current.selectedUnit.health > 0 ? current.selectedUnit : null;
    return {
        code: game.code,
        name: game.name,
        turn: game.turn,
        currentPlayer: game.currentPlayerIndex,
        viewer,
        players: game.players.map(p => ({
            index: p.index,
            name: p.name,
            type: p.type,
            state: p.state || "playing",
            autoNextFlag: !!p.autoNextFlag
        })),
        position: player.position ? {x: player.position.x, y: player.position.y} : null,
        fog: fogRows,
        units,
        selected: selected ? {clazz: selected.clazz, player: selected.player, id: selected.id, at: selected.derivedPosition()} : null,
        intelligence: intelligence && current.index === viewer ? describeIntelligence(current.intelligence) : null
    };
}
