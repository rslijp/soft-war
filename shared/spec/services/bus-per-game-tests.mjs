import MessageBus, {createMessageBus, currentBus, setBusResolver} from "../../services/message-service.mjs";
import {AsyncLocalStorage} from "async_hooks";
import {game} from "../../game/game.mjs";
import {humanPlayer} from "../../game/human-player.mjs";
import {testAllLandGameMap} from "../helpers/test-utils.mjs";

describe("a message bus per game", function() {
    const map = testAllLandGameMap();
    const games = new AsyncLocalStorage();

    beforeEach(function() {
        setBusResolver(() => games.getStore());
    });
    afterEach(function() {
        setBusResolver(null);
    });

    const newGame = (bus) => games.run(bus, () => {
        const player = new humanPlayer(0, "0", "Name", "Color", [], map);
        player.autoNextFlag = false;
        return new game({code: "code", name: "name", turn: 1, currentPlayer: 0}, map, [player]);
    });

    it("should only reach the game whose bus is current", function() {
        //Given
        const busA = createMessageBus(), busB = createMessageBus();
        const gameA = newGame(busA), gameB = newGame(busB);

        //When
        games.run(busA, () => MessageBus.send("auto-next"));

        //Then
        expect(gameA.currentPlayer().autoNextFlag).toBeTruthy();
        expect(gameB.currentPlayer().autoNextFlag).toBeFalsy();
        expect(busA.registrations["auto-next"].length).toEqual(1);
        expect(busB.registrations["auto-next"].length).toEqual(1);
    });

    it("should keep a game's bus in its timers", function(done) {
        //Given
        const busA = createMessageBus(), busB = createMessageBus();
        const gameA = newGame(busA), gameB = newGame(busB);

        //When: a timer started by game B fires while nothing else is running
        games.run(busB, () => setTimeout(() => MessageBus.send("auto-next"), 0));

        //Then
        setTimeout(() => {
            expect(gameA.currentPlayer().autoNextFlag).toBeFalsy();
            expect(gameB.currentPlayer().autoNextFlag).toBeTruthy();
            done();
        }, 10);
    });

    it("should use the default bus outside any game", function() {
        expect(currentBus()).toBe(currentBus());
        expect(games.run(createMessageBus(), () => currentBus())).not.toBe(currentBus());
    });
});
