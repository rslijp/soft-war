import {generateMap, generatePlayerList} from "../../services/map-service.mjs";
import {GameView} from "../../view/game-view.mjs";
import {deserializeGameState} from "../../services/save-game.mjs";
import {gameHost} from "../../services/game-host.mjs";
import {unitRef} from "../../services/commands.mjs";

function newHost(players = ["", ""]) {
    let world, list;
    while (!list) {
        world = generateMap("REGULAR", 48, 48);
        try {
            list = generatePlayerList({email: "a@example.com", name: "A"}, players, world);
        } catch (e) {
            list = null;
        }
    }
    // the first extra player is a human in these specs
    if (list[1]) list[1].type = "Human";
    return gameHost(() => deserializeGameState({code: "spec", name: "spec", turn: 1, currentPlayer: 0, players: list, map: world}));
}

function screen(player) {
    const received = [];
    return {player, received, send: (message) => received.push(JSON.parse(JSON.stringify(message)))};
}

describe("a hosted game", function() {
    let host;
    afterEach(function() {
        if (host) host.stop();
    });

    it("should send a new screen the map and its player's view, as plain data", function() {
        //Given
        host = newHost();
        const one = screen(0);

        //When
        host.attach(one);

        //Then
        expect(one.received.map(m => m.type)).toEqual(["map", "view"]);
        const view = one.received[1].view;
        expect(view.viewer).toEqual(0);
        expect(view.fog.length).toEqual(48);
        expect(view.units.some(u => u.player === 0 && u.clazz === "city")).toBeTruthy();
    });

    it("should not show units of others that are out of sight", function() {
        //Given
        host = newHost();
        const one = screen(0);
        host.attach(one);
        const view = one.received[1].view;

        //Then
        view.units.filter(u => u.player === 1).forEach(u => {
            expect(view.fog[u.at.y][u.at.x]).toEqual("2");
        });
        view.units.filter(u => u.clazz === "city" && u.player !== 0 && u.player !== null).forEach(u => {
            expect(view.fog[u.at.y][u.at.x]).toEqual("2");
        });
    });

    it("should only take commands from the player whose turn it is", function() {
        //Given
        host = newHost();
        const one = screen(0), two = screen(1);
        host.attach(one);
        host.attach(two);
        const before = host.game.player(1).autoNextFlag;

        //When
        const accepted = host.command(two, "auto-next");
        const unknown = host.command(one, "teleport", []);

        //Then
        expect(accepted).toBeFalsy();
        expect(unknown).toBeFalsy();
        expect(host.game.player(1).autoNextFlag).toEqual(before);
        expect(host.command(one, "auto-next")).toBeTruthy();
    });

    it("should turn a reference from a screen into the engine's unit", function() {
        //Given
        host = newHost();
        const one = screen(0);
        host.attach(one);
        const city = host.game.player(0).units.find(u => u.clazz === "city");

        //When
        host.command(one, "change-production", [unitRef(city), "F"]);

        //Then
        expect(city.producingType).toEqual("F");
    });

    it("should tell only the new player that their turn starts", function() {
        //Given
        host = newHost();
        const one = screen(0), two = screen(1);
        host.attach(one);
        host.attach(two);

        //When
        host.command(one, "next-turn");

        //Then
        const turnStarts = (s) => s.received.filter(m => m.type === "event" && m.name === "new-turn");
        expect(turnStarts(one).length).toEqual(0);
        expect(turnStarts(two).length).toEqual(1);
        expect(host.game.currentPlayerIndex).toEqual(1);
    });

    it("should rebuild what a screen needs from the snapshots", function() {
        //Given
        host = newHost();
        const one = screen(0);
        host.attach(one);
        const [mapMessage, viewMessage] = one.received;

        //When
        const model = new GameView(mapMessage.map).update(viewMessage.view);

        //Then
        const own = viewMessage.view.units.find(u => u.player === 0 && u.clazz === "city");
        const unit = model.world().unitAt(own.at);
        expect(unit.clazz).toEqual("city");
        expect(unit.getName()).toEqual(own.name);
        expect(unit.nestedUnits.length).toEqual(own.nested.length);
        expect(model.currentPlayer().index).toEqual(0);
        expect(model.spectator().fogOfWar.visible(own.at)).toBeTruthy();
        expect(model.dimensions()).toEqual({width: 48, height: 48});
        expect(model.world().world[own.at.y][own.at.x].type).toEqual("L");
    });
});
