import {deserializeGameState, serializeGameState} from "../../services/save-game.mjs";
import {generateMap, generatePlayerList} from "../../services/map-service.mjs";
import MessageBus from "../../services/message-service.mjs";

function newState() {
    let world, players;
    while (!players) {
        world = generateMap("REGULAR", 48, 48);
        try {
            players = generatePlayerList({email: "a@example.com", name: "A"}, [""], world);
        } catch (e) {
            players = null;
        }
    }
    return {code: "spec", name: "spec", turn: 1, currentPlayer: 0, players, map: world};
}

// a land tile next to the player's city, where a unit can stand outside the city
function landNextTo(state, playerIndex) {
    const city = state.players[playerIndex].cities[0];
    const rows = state.map.world;
    for (const [dy, dx] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const y = city.y + dy, x = city.x + dx;
        const isCity = state.map.cities.some(c => c[0] === y && c[1] === x);
        if (rows[y] && rows[y][x] === "L" && !isCity) return {y, x};
    }
    return null;
}

describe("saving and loading a game", function() {
    afterEach(function() {
        MessageBus.clear();
    });

    it("should skip a unit that is in the list twice outside a city", function() {
        //Given: a save from before the fix, with the same unit twice
        const state = newState();
        const at = landNextTo(state, 1);
        if (!at) return pending("no free land next to the city on this map");
        const order = {action: "move", queue: [{y: at.y, x: at.x, direction: "X"}]};
        state.players[1].units = [
            {type: "T", y: at.y, x: at.x, health: 2, order},
            {type: "T", y: at.y, x: at.x, health: 2, order}
        ];

        //When
        const game = deserializeGameState(state);

        //Then
        expect(game.player(1).units.filter(u => u.clazz === "unit").length).toEqual(1);
    });

    it("should keep two alike units in a city", function() {
        //Given
        const state = newState();
        const city = state.players[0].cities[0];
        state.players[0].units = [
            {type: "T", y: city.y, x: city.x, health: 2},
            {type: "T", y: city.y, x: city.x, health: 2}
        ];

        //When
        const game = deserializeGameState(state);

        //Then
        expect(game.player(0).units.filter(u => u.clazz === "unit").length).toEqual(2);
    });

    it("should not load or save destroyed units, nor the same unit twice", function() {
        //Given
        const state = newState();
        const at = landNextTo(state, 0);
        if (!at) return pending("no free land next to the city on this map");
        state.players[0].units.push({type: "T", y: at.y, x: at.x, health: 0});
        const game = deserializeGameState(state);
        const player = game.player(0);
        expect(player.units.filter(u => u.clazz === "unit").length).toEqual(1);

        //When: something put the same unit in the list twice
        player.units.push(player.units.find(u => u.clazz === "unit"));
        const dead = player.units.find(u => u.clazz === "unit");
        const saved = serializeGameState(game);

        //Then
        expect(saved.players[0].units.length).toEqual(1);
        dead.health = 0;
        expect(serializeGameState(game).players[0].units.length).toEqual(0);
    });
});
