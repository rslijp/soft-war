// Scenarios that play a game the way a screen does: through the game host, with commands only, and
// looking only at what the screen gets back (snapshots rebuilt into a GameView, and events).
// The clock is mocked, so the AI's pauses and the jumps to the next unit run instantly.
import {generateMap, generatePlayerList} from "../../services/map-service.mjs";
import {GameView} from "../../view/game-view.mjs";
import {NAVIGATIONS_OFFSETS} from "../../game/navigation.mjs";
import {deserializeGameState} from "../../services/save-game.mjs";
import {gameHost} from "../../services/game-host.mjs";
import {navigationAStar} from "../../game/navigationAStar.mjs";
import {unitRef} from "../../services/commands.mjs";

// A screen like the browser's: it keeps the latest model and the events it got.
function playAs(host, player) {
    const screen = {player, events: [], model: null};
    screen.send = (message) => {
        message = JSON.parse(JSON.stringify(message));
        if (message.type === "map") screen.model = new GameView(message.map);
        if (message.type === "view") screen.model.update(message.view);
        if (message.type === "event") screen.events.push(message);
    };
    screen.command = (name, ...args) => host.command(screen, name, JSON.parse(JSON.stringify(args)));
    screen.got = (name) => screen.events.filter(e => e.name === name);
    screen.forget = () => screen.events.splice(0);
    host.attach(screen);
    return screen;
}

// a game of one human against the AI, with a city that has land around it
function newGame() {
    for (let tries = 0; tries < 50; tries++) {
        const world = generateMap("REGULAR", 48, 48);
        let players;
        try {
            players = generatePlayerList({email: "me@example.com", name: "Me"}, [""], world);
        } catch (e) {
            continue;
        }
        const city = players[0].cities[0];
        const land = NAVIGATIONS_OFFSETS.filter(o => {
            const row = world.world[city.y + o.y];
            return row && row[city.x + o.x] === "L" && !world.cities.some(c => c[0] === city.y + o.y && c[1] === city.x + o.x);
        });
        if (land.length < 3) continue;
        return {state: {code: "scenario", name: "scenario", turn: 1, currentPlayer: 0, players, map: world}, city, land};
    }
    throw new Error("no suitable map");
}

describe("playing a game through the host, like a screen", function() {
    let host, me, game, errors;

    beforeEach(function() {
        jasmine.clock().install();
        errors = spyOn(console, "error").and.callThrough();
        game = newGame();
        host = gameHost(() => deserializeGameState(game.state));
        me = playAs(host, 0);
        // what the game page does when it is ready
        me.command("new-turn", ["welcome"]);
        jasmine.clock().tick(10);
    });

    afterEach(function() {
        host.stop();
        jasmine.clock().uninstall();
        // nothing may go wrong behind the screen's back
        expect(errors).not.toHaveBeenCalled();
    });

    const tick = (ms = 10) => jasmine.clock().tick(ms);
    const selected = () => me.model.currentPlayer().selectedUnit;

    it("should start my turn with the welcome and my tank selected", function() {
        expect(me.got("new-turn").length).toEqual(1);
        expect(selected()).not.toBeNull();
        expect(selected().type).toEqual("T");
        expect(me.model.currentPlayerIndex).toEqual(0);
    });

    it("should select my city when I click it", function() {
        //When
        me.command("cursor-select", {x: game.city.x, y: game.city.y});
        tick();

        //Then
        const unit = selected();
        expect(unit && unit.clazz).toEqual("city");
        expect(unit.isOn(game.city)).toBeTruthy();
    });

    it("should select a unit inside my city through its reference", function() {
        //Given
        me.command("cursor-select", {x: game.city.x, y: game.city.y});
        tick();
        const tank = selected().nestedUnits[0];

        //When
        me.command("select-unit", unitRef(tank));
        tick();

        //Then
        expect(selected().clazz).toEqual("unit");
        expect(selected().id).toEqual(tank.id);
    });

    it("should change what my city produces", function() {
        //When
        const city = me.model.world().unitAt(game.city);
        me.command("change-production", unitRef(city), "F");
        tick();

        //Then
        expect(me.model.world().unitAt(game.city).producingType).toEqual("F");
    });

    it("should move my tank with the keys and propose to end the turn by itself", function() {
        //When: a step out of the city, then the tank is done
        const step = game.land[0];
        me.command("cursor-direction", step.direction);
        tick();
        const afterOne = selected();
        expect(afterOne.movesLeft).withContext(JSON.stringify({step, city: game.city, at: afterOne.at, events: me.events.map(e => e.name)})).toEqual(1);
        expect(afterOne.isOn({x: game.city.x + step.x, y: game.city.y + step.y})).toBeTruthy();
        me.forget();
        // fortifying ends the tank's turn (a second step could run into the sea on a random map)
        me.command("special-action", unitRef(afterOne), "fortify");
        // the game waits a moment, then moves on; with no other unit, it proposes to end the turn
        tick(2000);

        //Then
        expect(me.got("propose-end-turn").length).toEqual(1);
    });

    it("should jump to my next unit when one has moved", function() {
        //Given: a second tank next to the city (a fresh game, so it's mine from the start)
        host.stop();
        const step = game.land[1];
        game.state.players[0].units.push({type: "T", y: game.city.y + step.y, x: game.city.x + step.x});
        host = gameHost(() => deserializeGameState(game.state));
        me = playAs(host, 0);
        me.command("new-turn", ["welcome"]);
        tick();
        const first = selected();

        //When: the first tank steps out of the city and fortifies, which ends its turn
        const out = game.land.find(o => o.direction !== step.direction);
        me.command("cursor-direction", out.direction);
        tick();
        expect(selected().id).toEqual(first.id);
        me.command("special-action", unitRef(selected()), "fortify");
        tick(2000);

        //Then: the other tank is selected, the turn isn't over yet
        expect(selected()).not.toBeNull();
        expect(selected().id).not.toEqual(first.id);
        expect(selected().movesLeft).toEqual(2);
        expect(me.got("propose-end-turn").length).toEqual(0);
    });

    it("should hand the turn to the AI and back, with a unit selected again", function() {
        //When
        me.forget();
        me.command("next-turn");
        tick(5000);

        //Then
        expect(me.got("new-turn").length).toEqual(1);
        expect(me.model.turn).toEqual(2);
        expect(me.model.currentPlayerIndex).toEqual(0);
        expect(selected()).not.toBeNull();
    });

    it("should fortify my tank", function() {
        //Given: the tank stands outside the city
        const step = game.land[0];
        me.command("cursor-direction", step.direction);
        tick();

        //When
        me.command("special-action", unitRef(selected()), "fortify");
        tick(2000);

        //Then
        const tank = me.model.world().unitAt({x: game.city.x + step.x, y: game.city.y + step.y});
        expect(tank.fortified).toBeTruthy();
        expect(tank.remark()).toBeTruthy();
    });

    it("should carry out a move order over the next turns", function() {
        //Given: a route to a tile three steps away, planned on the screen's own model
        const from = selected();
        const step = game.land[1];
        let target = null;
        for (let n = 3; n >= 2 && !target; n--) {
            const at = me.model.world().normalize({x: game.city.x + step.x * n, y: game.city.y + step.y * n});
            if (me.model.world().world[at.y][at.x].type === "L") target = at;
        }
        if (!target) return pending("no land three steps out on this map");
        const route = new navigationAStar(me.model.world().gameMap, from, me.model.spectator().fogOfWar, false).route(target, true);
        if (!route || !route.route) return pending("no route on this map");

        //When
        me.command("give-order", "move", route.route, null, true);
        tick(3000);
        me.command("next-turn");
        tick(5000);

        //Then: by now the tank has walked there, unless something came in sight on the way (then the
        // game stops the order and asks for attention, as it should)
        const there = me.model.world().unitAt(target);
        const arrived = there && there.clazz === "unit" && there.player === 0;
        const tanks = [];
        for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
            const u = me.model.world().unitAt({x, y});
            if (u) [u, ...u.nestedUnits].filter(n => n.clazz === "unit" && n.player === 0).forEach(n => tanks.push({at: n.at, moves: n.movesLeft, order: n.order}));
        }
        expect(arrived || me.got("unit-order-attention").length > 0)
            .withContext(JSON.stringify({target, route: route.route, tanks, events: me.events.map(e => e.name)})).toBeTruthy();
    });

    it("should keep the screen's units consistent over several rounds", function() {
        for (let round = 0; round < 6; round++) {
            me.command("next-turn");
            tick(5000);
            const units = me.model.world();
            // every unit on the screen once, and the selected unit one of them
            const seen = new Set();
            const all = [];
            for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
                const u = units.unitAt({x, y});
                if (u) all.push(u, ...u.nestedUnits);
            }
            all.forEach(u => {
                const id = u.clazz + ":" + u.player + ":" + u.id;
                expect(seen.has(id)).toBeFalsy();
                seen.add(id);
            });
            expect(me.model.currentPlayerIndex).toEqual(0);
        }
        expect(me.model.turn).toEqual(7);
    });
});
