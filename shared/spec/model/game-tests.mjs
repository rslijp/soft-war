import {testAllLandGameMap} from "../helpers/test-utils.mjs";
import {unit} from "../../game/unit.mjs";
import {humanPlayer} from "../../game/human-player.js";
import {game} from "../../game/game.mjs";
import {MessageBus} from "../../index.js";
import {city} from "../../game/city.mjs";
import {battle} from "../../game/battle.mjs";

describe("game", function(){
    var map = testAllLandGameMap();
    
    describe("constructor", function(){
       it("should construct a unitsmap on initialization", function(){
           //Given
           var units = [
                new unit("T", {x: 3, y:3}),
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
           var players = [new humanPlayer(0,"Name", "Color", units, map)];

           //When
           var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", players);

           //Then
           expect(gameInstance.unitsMap.map).toEqual("data");
           // expect(gameInstance.unitsMap.players).toEqual(players);
           expect(gameInstance.statistics.length).toEqual(1);
           expect(gameInstance.statistics[0].player).toEqual(players[0]);
           // expect(statistics).toHaveBeenCalledWith(players[0]);
       });
       it("should set unitsMap on players", function(){
           //Given
           var red = new humanPlayer(0,"Red", "Color", []);
           var blue = new humanPlayer(1,"Blue", "Color", []);
           var players = [red, blue];
           
           //When
           var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0}, map, players);

           //Then
           expect(gameInstance.unitsMap).toBeDefined();
           expect(red.unitsMap).toEqual(gameInstance.unitsMap);
           expect(blue.unitsMap).toEqual(blue.unitsMap);
       });
    });
    describe("cursorSelect method", function(){
        it("should set the selected unit on the given position on the current user", function(){
            //Given
            var units = [
                new unit("T", {x: 3, y:3}),
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player]);
            
            //When
            gameInstance.cursorSelect({y: 7, x: 7});

            //Then
            expect(gameInstance.currentPlayer().selectedUnit).toEqual(units[2]);
        });
        it("should not set the selected unit on the current user when the unit at hand is of the other user", function(){
            //Given
            var units = [
                new unit("T", {x: 3, y:3}),
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(1,"Name", "Color", units, map);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player]);

            //When
            gameInstance.cursorSelect({y: 7, x: 7});

            //Then
            expect(gameInstance.currentPlayer().selectedUnit).toBeNull();
        });
        it("should not set the selected unit when none exists on that location", function(){
            //Given
            var units = [
                new unit("T", {x: 3, y:3}),
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player]);
            
            //When
            gameInstance.cursorSelect({y: 4, x: 4});

            //Then
            expect(gameInstance.currentPlayer().selectedUnit).toEqual(null);
        });
    });
    describe("moveInDirection method", function(){
        it("should update current position and set that position", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            gameInstance.currentPlayer().position={x: 1, y: 2};
            spyOn(gameInstance.map, "move").and.returnValue({x: 1, y:3});
            spyOn(gameInstance, "setPosition");

            //When
            gameInstance.moveInDirection("down");

            expect(gameInstance.map.move).toHaveBeenCalledWith("down", {x: 1, y:2});
            expect(gameInstance.setPosition).toHaveBeenCalledWith({x: 1, y:3});    
        });
    });
    describe("setPosition method", function(){
        it("should update the position on the current player", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var position={x: 1, y: 2};
            spyOn(player, "cursorUpdate");
            spyOn(MessageBus, "send");

            //When
            gameInstance.setPosition(position);

            //Then
            expect(player.cursorUpdate).toHaveBeenCalledWith(position);
        });
        it("should update send an update screen request", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            player.position={x: 1, y: 2};
            spyOn(player, "cursorUpdate").and.returnValue(true);
            spyOn(MessageBus, "send");

            //When
            gameInstance.setPosition(player.position);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("screen-update", {x: 1, y: 2});
        });
        it("should update send an update infobar request when a unit selected", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var position={x: 1, y: 2};
            player.selectedUnit="a unit";
            spyOn(player, "cursorUpdate").and.returnValue(true);
            spyOn(MessageBus, "send");

            //When
            gameInstance.setPosition(position);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("infobar-update");
        });
        it("should not update send an update screen request when the cursor update failed", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var position={x: 1, y: 2};
            spyOn(player, "cursorUpdate").and.returnValue(false);
            spyOn(MessageBus, "send");

            //When
            gameInstance.setPosition(position);

            //Then
            expect(MessageBus.send).not.toHaveBeenCalledWith("screen-update", undefined);
        });
        it("should not update send an update infobar request when a unit selected", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var position={x: 1, y: 2};
            player.selectedUnit="a unit";
            spyOn(player, "cursorUpdate").and.returnValue(false);
            spyOn(MessageBus, "send");

            //When
            gameInstance.setPosition(position);

            //Then
            expect(MessageBus.send).not.toHaveBeenCalledWith("infobar-update");
        });
    });
    describe("cityUnderSiege method", function(){
        it("should perform battle with units in cityInstance", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new unit("T", {y:1, x:0});
            var cityInstance = new city(at, "Tiel");
            cityInstance.nestedUnits=[new unit("T")]
            spyOn(gameInstance,"battle");
            
            //When
            gameInstance.cityUnderSiege(attacker, cityInstance, at);

            //Then
            expect(gameInstance.battle).toHaveBeenCalledWith(attacker, cityInstance.nestedUnits[0],at);
        });
        it("should perform battle with units in cityInstance even when the attacker isn't a ground force", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new unit("T", {y:1, x:0});
            var cityInstance = new city(at, "Tiel");
            cityInstance.nestedUnits=[new unit("T")]
            spyOn(gameInstance,"battle");

            //When
            gameInstance.cityUnderSiege(attacker, cityInstance, at);

            //Then
            expect(gameInstance.battle).toHaveBeenCalledWith(attacker, cityInstance.nestedUnits[0],at);
        });
        it("should perform battle with cityInstance defense when no units present", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new unit("T", {y:1, x:0});
            var cityInstance = new city(at, "Tiel");
            spyOn(cityInstance, "siege").and.returnValue("cityInstance-defense")
            spyOn(gameInstance,"battle");

            //When
            gameInstance.cityUnderSiege(attacker, cityInstance, at);

            //Then
            expect(gameInstance.battle).toHaveBeenCalledWith(attacker, "cityInstance-defense",at, true);
        });
        it("should not take the cityInstance when your are not a ground force", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new unit("F", {y:1, x:0});
            var cityInstance = new city(at, "Tiel");
            spyOn(cityInstance, "siege").and.returnValue("cityInstance-defense")
            spyOn(gameInstance,"battle");

            //When
            gameInstance.cityUnderSiege(attacker, cityInstance, at);

            //Then
            expect(gameInstance.battle).not.toHaveBeenCalled();
        });
    });
    describe("battle method", function(){
        it("should perform an battle between the attacker and the defender", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){},position: function(){}}, [player]);
            var attacker = new unit("T", {y:1, x: 2});
            var defender = new unit("T", {y:2, x: 2});
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(gameInstance,"_createBattle").and.returnValue(battle);
            spyOn(battle, "fight").and.returnValue({});
            spyOn(MessageBus, "send");
            //When
            gameInstance.battle(attacker, defender, at);

            //Then
            // expect(Model.Battle).toHaveBeenCalledWith(attacker, defender, [], []);
            expect(battle.fight).toHaveBeenCalled();
        });
        it("should perform an battle and include the modfiers", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){},position: function(){return "Land"}}, [player]);
            var attacker = new unit("T", {y:1, x: 2});
            var defender = new unit("T", {y:2, x: 2});
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(gameInstance,"_createBattle").and.returnValue(battle);
            spyOn(battle, "fight").and.returnValue({});
            spyOn(MessageBus, "send");

            spyOn(attacker, "modifiers").and.returnValue("attacker modifiers");
            spyOn(defender, "modifiers").and.returnValue("defender modifiers");
                        

            //When
            gameInstance.battle(attacker, defender, at);

            //Then
            expect(attacker.modifiers).toHaveBeenCalledWith(defender, "Land");
            expect(defender.modifiers).toHaveBeenCalledWith(attacker, "Land");
            expect(gameInstance._createBattle).toHaveBeenCalledWith(attacker, defender, "attacker modifiers", "defender modifiers");
        });
        it("should destroy the defender and move the attacker to the new position when attacker wins", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){},position: function(){}}, [player]);
            var attacker = new unit("T", {y:1, x: 2});
            attacker.health=1;
            var defender = new unit("T", {y:2, x: 2});
            defender.health=0;
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(gameInstance,"_createBattle").and.returnValue(battle);
            spyOn(battle, "fight").and.returnValue({rounds: "battleresults"});
            spyOn(MessageBus, "send");
            //When
            gameInstance.battle(attacker, defender, at,true);

            //Then
            expect(MessageBus.send.calls.argsFor(0)).toEqual(["battle-results", attacker, defender, {rounds: "battleresults"}]);
            expect(MessageBus.send.calls.argsFor(1)).toEqual(["unit-destroyed", defender, gameInstance.currentPlayer()]);
            expect(MessageBus.send.calls.argsFor(2)).toEqual(["move-unit", attacker, at, true]);
        });
        it("should destroy the attacker when defender wins", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},{move: function(){},position: function(){}}, [player]);
            var attacker = new unit("T", {y:1, x: 2});
            attacker.health=0;
            var defender = new unit("T", {y:2, x: 2});
            defender.health=1;

            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(gameInstance,"_createBattle").and.returnValue(battle);
            spyOn(battle, "fight").and.returnValue({rounds: "battleresults", defenderDamage: 3});
            spyOn(MessageBus, "send");
            //When
            gameInstance.battle(attacker, defender, at);

            //Then
            expect(MessageBus.send.calls.argsFor(0)).toEqual(["battle-results", attacker, defender, {rounds: "battleresults", defenderDamage: 3}]);
            expect(MessageBus.send.calls.argsFor(1)).toEqual(["unit-attacked", defender, 3]);
            expect(MessageBus.send.calls.argsFor(2)).toEqual(["unit-destroyed", attacker, gameInstance.currentPlayer()]);
                        
        });
    });
    describe("nextUnit method", function(){
        var units = [
            new unit("T", {x: 3, y:3}),
            new unit("T", {x: 13, y:12}),
            new unit("F", {x: 7, y:7})
        ];

        var data = {x:"X",move: function(){}};
        var player = new humanPlayer(0,"Name", "Color", units, map);
        var other = new humanPlayer(0,"Name", "Color", []);
        var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},data, [player, other]);
        player.selectedUnit=null;

        it("should select next unit", function(){
            //Given
            spyOn(player.carrousel, "next").and.returnValue("next unit");
            spyOn(gameInstance, "selectUnit");
            spyOn(MessageBus, "send");
            
            //When
            gameInstance.nextUnit();

            //Then
            expect(player.carrousel.next).toHaveBeenCalled();
            expect(gameInstance.selectUnit).toHaveBeenCalledWith("next unit")
        });
        it("should send bus event that next unit is selected", function(){
            //Given
            spyOn(player.carrousel, "next").and.returnValue("next unit");
            spyOn(gameInstance, "selectUnit");
            spyOn(MessageBus, "send");

            //When
            gameInstance.nextUnit();

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("next-unit-updated","next unit")
        });
        it("should execute the order of the selected unit", function(){
            //Given
            var infantry = new unit("I", {y: 6, x: 3}).initTurn();
            infantry.player=0;
            infantry.order={action: "direction", direction: "N"};
            spyOn(player.carrousel, "next").and.returnValue(infantry);
            spyOn(gameInstance, "selectUnit");
            spyOn(MessageBus, "send");
            spyOn(gameInstance.unitsMap, "move");
            spyOn(data, "move").and.returnValue("direction");

            //When
            gameInstance.nextUnit();

            //Then
            expect(gameInstance.unitsMap.move).toHaveBeenCalled()
        });
    });
    describe("nextTurn method", function(){
        it("should hand over turn to other player", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=null;

            expect(gameInstance.currentPlayer()).toEqual(player);
            var currentTurn = gameInstance.turn;
            
            //When
            gameInstance.nextTurn();

            //Then
            expect(gameInstance.currentPlayer()).toEqual(other);
            expect(gameInstance.turn).toEqual(currentTurn);
        });
        it("should hand over turn to first player and increase turn when last player in turn is done", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            gameInstance.currentPlayerIndex=1;
            expect(gameInstance.currentPlayer()).toEqual(other);
            var currentTurn = gameInstance.turn;

            //When
            gameInstance.nextTurn();

            //Then
            expect(gameInstance.currentPlayer()).toEqual(player);
            expect(gameInstance.turn).toEqual(currentTurn+1);
        });
        it("should init turn of new player", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            expect(gameInstance.currentPlayer()).toEqual(player);
            spyOn(other, "initTurn");
            
            //When
            gameInstance.nextTurn();

            //Then
            expect(other.initTurn).toHaveBeenCalled();
        });
        it("should trigger a new turn dialog", function(){
            //Given
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(0,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            other.messages=["No messages"]
            expect(gameInstance.currentPlayer()).toEqual(player);
            spyOn(MessageBus, "send");
            
            //When
            gameInstance.nextTurn();

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("new-turn", ["No messages"],0);
        });
    });
    describe("cityConquered method", function(){
        it("should transfer cityInstance", function(){
            //Given
            var cityInstance =  new city("Tiel", {x: 4, y:8});
            var player = new humanPlayer(0,"Name", "Color", [cityInstance]);
            var other = new humanPlayer(1,"Name", "Color", []);
            spyOn(cityInstance, "conquered").and.callThrough();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);

            //When
            gameInstance.cityConquered({city: cityInstance}, other);

            //Then
            expect(cityInstance.conquered).toHaveBeenCalledWith(1);
            expect(player.units.length).toEqual(0);
            expect(other.units.length).toEqual(1);
            expect(other.units[0]).toEqual(cityInstance);
        });
        it("should claim neutral cityInstance", function(){
            //Given
            var cityInstance =  new city("Tiel", {x: 4, y:8});
            var player = new humanPlayer(0,"Name", "Color", [cityInstance]);
            spyOn(cityInstance, "conquered").and.callThrough();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player]);

            //When
            gameInstance.cityConquered({city: cityInstance}, player);

            //Then
            expect(cityInstance.conquered).toHaveBeenCalledWith(0);
            expect(player.units.length).toEqual(1);
        });
        it("should update fog of war", function(){
            //Given
            var cityInstance =  new city("Tiel", {x: 4, y:8});
            var player = new humanPlayer(0,"Name", "Color", [cityInstance]);
            var other = new humanPlayer(1,"Name", "Color", []);
            spyOn(player.fogOfWar, "remove");
            spyOn(other.fogOfWar, "add");
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);

            //When
            gameInstance.cityConquered({city: cityInstance}, other);

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalledWith(cityInstance);
            expect(other.fogOfWar.add).toHaveBeenCalledWith(cityInstance);
            
        });
    });
    describe("specialAction method", function(){
        it("should delegate call to player", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            var units = [
                infantry,
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", []);
            var other = new humanPlayer(1,"Name", "Color", units, map);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player]);
            player.selectedUnit=infantry;
            spyOn(player, "specialAction");
            
            //When
            gameInstance.specialAction(infantry, "fortify")

            //Then
            expect(player.specialAction).toHaveBeenCalledWith("fortify");
        });
        it("should update the screen", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0; 
                         var units = [
                             infantry,
                             new unit("T", {x: 13, y:12}),
                             new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.position="position";
            other.position="other position";
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.specialAction(infantry, "fortify")

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("screen-update", "position");
        });
        it("should update the infobar when unit is selected", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
                         var units = [
                             infantry,
                             new unit("T", {x: 13, y:12}),
                             new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.position="position";
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.specialAction(infantry, "fortify")

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("infobar-update");
        });
        it("should not update the infobar when unit is not selected", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
                         var units = [
                             infantry,
                             new unit("T", {x: 13, y:12}),
                             new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.position="position";
            player.selectedUnit=null;
            spyOn(MessageBus, "send");

            //When
            gameInstance.specialAction(infantry, "fortify")

            //Then
            expect(MessageBus.send).not.toHaveBeenCalledWith("infobar-update");
        });
    });
    describe("revokeOrder method", function(){
        it("should revoke order of the selected unit", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.revokeOrder(true);

            //Then
            expect(infantry.order).toBeNull();
        });
        it("should revoke order of the selected unit", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.revokeOrder(true);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("order-revoked");
        });
        it("should ask for confirmation of revoking of order when command is not confirmed", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.revokeOrder(false);

            //Then
            expect(infantry.order).toEqual("the order");
            expect(MessageBus.send).toHaveBeenCalledWith("confirm-order", infantry);
        });
        it("should handle no selected unit", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=null;
            spyOn(MessageBus, "send");
            
            //When
            gameInstance.revokeOrder(true);

            //Then
            //no smoke
        });
    });
    describe("giveOrder method", function(){
        it("should set order on a unit", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("move", "queue", null, true);

            //Then
            expect(infantry.order).toEqual({ action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should emit order given event", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("move", "queue", null, true);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("order-given", { action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should execute the selected order", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},map, [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("direction", null, "S", true);

            //Then
            expect(infantry.derivedPosition()).toEqual({x: 3, y: 4});
        });
        it("should ask for confirmation when the given order is not confirmed", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("move", "queue", null, false);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(MessageBus.send).toHaveBeenCalledWith("confirm-order", infantry, { action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should set not set an order on a unit when there is no unit selected", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=null;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("move", "queue", null, true);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(MessageBus.send).not.toHaveBeenCalledWith()
        });
        it("should set not set an order on a unit when there is no action", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder(null, "queue", null, true);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(MessageBus.send).not.toHaveBeenCalledWith()
        });
        it("should set set an order on a unit when there is no path", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map);
            var other = new humanPlayer(1,"Name", "Color", []);
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(MessageBus, "send");

            //When
            gameInstance.giveOrder("roam", null, null, true);

            //Then
            expect(infantry.order).toEqual({action: "roam", direction: null, queue: null})
            expect(MessageBus.send).toHaveBeenCalledWith("order-given", {action: "roam", direction: null, queue: null});
        });
    });
    describe("endTurn method", function(){
        it("should initiated end the turn phase when there are moveable units", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            var units = [
                 infantry,
                 new unit("T", {x: 13, y:12}),
                 new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            spyOn(MessageBus,"send");
            infantry.movesLeft=1;
            
            //When
            gameInstance.endTurn();

            ///Then
            expect(MessageBus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should end the turn when there are no moveable units", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            var units = [infantry];
            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            spyOn(MessageBus,"send");
            infantry.movesLeft=0;

            //When
            gameInstance.endTurn();

            ///Then
            expect(MessageBus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should end the turn when there are no moveable units with orders", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            spyOn(MessageBus,"send");
            infantry.movesLeft=0;
       
            //When
            gameInstance.endTurn();

            ///Then
            expect(MessageBus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should proceed to end of the turn phase when there are  moveable units with orders", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            spyOn(MessageBus,"send");
            infantry.movesLeft=1;
            
            //When
            gameInstance.endTurn();

            ///Then
            expect(MessageBus.send).toHaveBeenCalledWith("end-of-turn-phase");
        });
        it("should end of the turn phase flag on the player when there are  moveable units with orders", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);
            spyOn(MessageBus,"send");
            infantry.movesLeft=1;
            player.endTurnPhase=false;
            //When
            gameInstance.endTurn();

            ///Then
            expect(player.endTurnPhase).toEqual(true);
        });
    });
    describe("winOrLoose method", function(){
        it("should declare a loss when a player is without cities and units", function(){
            var infantry = new unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry, new city({y: 3, x: 2}, "Tiel")];

            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);

            spyOn(MessageBus, "send");

            gameInstance.winOrLoose(1);

            expect(MessageBus.send).toHaveBeenCalledWith("player-looses", other);
        });
        it("should declare a win when a player the only one not lost", function(){
            var infantry = new unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry, new city({y: 3, x: 2}, "Tiel")];

            var player = new humanPlayer(0,"Name", "Color", units, map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", []).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other]);

            spyOn(MessageBus, "send");

            gameInstance.winOrLoose(1);

            expect(MessageBus.send).toHaveBeenCalledWith("player-wins", player);
            expect(player.hasWon()).toBeTruthy();
            expect(other.hasLost()).toBeTruthy();
        });
        it("should not declare a win when there are other players that haven't lost not lost", function(){
            var infantry1 = new unit("I", {x: 3, y:3});
            var infantry2 = new unit("I", {x: 2, y:2});


            var player = new humanPlayer(0,"Name", "Color", [infantry1, new city({y: 3, x: 2}, "Tiel")], map).initTurn();
            var other = new humanPlayer(1,"Name", "Color", [], map).initTurn();
            var left = new humanPlayer(2,"Name", "Color", [infantry2, new city({y: 2, x: 3}, "Tiel")], map).initTurn();
            var gameInstance = new game({code: "code", name: "name", turn: 1, currentPlayer: 0},"data", [player, other,left]);

            spyOn(MessageBus, "send");

            gameInstance.winOrLoose(1);

            expect(MessageBus.send).not.toHaveBeenCalledWith("player-wins", player);
            expect(!player.hasWon() && !player.hasLost()).toBeTruthy();
            expect(!left.hasWon() && !left.hasLost()).toBeTruthy();
            expect(other.hasLost()).toBeTruthy();
        });
        
    });
});