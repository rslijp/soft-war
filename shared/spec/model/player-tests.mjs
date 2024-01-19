import {unit} from "../../game/unit.mjs";
import {humanPlayer} from "../../game/human-player.js";
import {testGameMap} from "../helpers/test-utils.mjs";
import {MessageBus} from "../../index.js";
import {city} from "../../game/city.mjs";
import {unitTypes} from "../../game/unit-types.mjs";
import {unitsMap} from "../../game/units-map.mjs";

const map = testGameMap();

describe("humanPlayer class", function(){
    describe("cursorSelect method", function(){
        it("should set the selected unit on the given position", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0",  "Name", "Color",units, map);
            player.selectedUnit=null;

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(units[0]);
        });
        it("should clear the selected unit when the same unit is selected ", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0",  "Name", "Color",units, map);
            player.selectedUnit=units[0];

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(null);
        });
        it("should update the selected unit when a other unit is selected ", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0",  "Name", "Color",units, map);
            player.selectedUnit=new unit("T", {y:13, x:12});

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(units[0]);
        });
    });
    describe("updateSelectedUnit", function(){
        it("should reschedule old unit when unit is updated", function(){
            var tank = new unit("T", {y: 3, x:3}).initTurn();
            var player = new humanPlayer(0, "0",  "Name", "Color", [tank], map);
            player.selectedUnit=tank;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).toHaveBeenCalledWith(tank);
        });
        it("should not reschedule old unit when old unit is out of move", function(){
            var tank = new unit("T", {y: 3, x:3}).initTurn();
            tank.movesLeft=0;
            var player = new humanPlayer(0, "0",  "Name", "Color", [tank], map);
            player.selectedUnit=tank;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).not.toHaveBeenCalledWith(tank);
        });
        it("should hanlde no old unit scenario", function(){
            var player = new humanPlayer(0, "0",  "Name", "Color", [], map);
            player.selectedUnit=null;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).not.toHaveBeenCalled();
        });
    });
    describe("cursorUpdate method", function(){
        it("should not change anything when no unit is selected", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.selectedUnit=null;
            spyOn(MessageBus, "send")
            //When
            var success = player.cursorUpdate({y: 3, x: 4});

            //Then
            expect(success).toBeTruthy();
            expect(player.position).toEqual({y: 3, x:4});
            expect(units[0].position).toEqual({y: 3, x:3});
            expect(MessageBus.send).not.toHaveBeenCalled();
        });
        it("should update the position of the selected unit", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.selectedUnit=units[0];
            player.unitsMap = new unitsMap([player], map);
            spyOn(player.unitsMap, "move")

            //When
            var success = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(success).toBeTruthy();
            expect(player.position).toEqual({y: 3, x:3});
            expect(units[0].position).toEqual({y: 3, x:3});
            expect(player.unitsMap.move).toHaveBeenCalledWith(units[0], {y: 4, x: 4});
        });
        it("should update the fog of war on movement of unit", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.selectedUnit=units[0];
            player.unitsMap = new unitsMap([player], map);
            spyOn(player.unitsMap, "move")
            spyOn(player.fogOfWar, "remove");
            spyOn(player.fogOfWar, "add");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalled();
            expect(player.fogOfWar.remove.calls.mostRecent().args[0].position).toEqual({y: 3, x:3});
            expect(player.fogOfWar.add).toHaveBeenCalled();
        });
        it("should proceed to next unit", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.unitsMap = new unitsMap([player], map);
            player.selectedUnit=units[0];
            spyOn(player.unitsMap, "move").and.returnValue(true)

            spyOn(player,"jumpToNextUnit");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.jumpToNextUnit).toHaveBeenCalledWith(tank);
        });
        it("should proceed to next unit when move failed", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.unitsMap = new unitsMap([player], map);
            player.selectedUnit=units[0];
            spyOn(player.unitsMap, "move").and.returnValue(false)

            spyOn(player,"jumpToNextUnit");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.jumpToNextUnit).not.toHaveBeenCalledWith();
        });
        it("should ask to clear the order when manual move is made on a unit with an order", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.selectedUnit=tank;
            player.position = {y: 3, x: 3};
            tank.order="some order"
            spyOn(MessageBus, "send")

            //When
            var success = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(success).toBeFalsy();
            expect(player.position).toEqual({y: 3, x:3});
            expect(units[0].position).toEqual({y: 3, x:3});
            expect(MessageBus.send).toHaveBeenCalledWith("confirm-order", tank);
        });
    });
    describe("destroyed method", function(){
        it("should cleanup unit", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            expect(tank.player).toEqual(player.index);

            //When
            player.destroyed(tank)

            //Then
            expect(player.units.indexOf(tank)).toEqual(-1);
        });
        it("should cleanup unit loaded untis", function(){
            //Given
            var transport = new unit("t", {y: 3, x:3});
            var tank = new unit("T", {y: 3, x:3}).initTurn();
            var infantry = new unit("I", {y: 3, x:3}).initTurn();
            transport.load(tank);
            transport.load(infantry);

            var units = [transport, tank, infantry];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);

            //When
            player.destroyed(transport)

            //Then
            expect(player.units.indexOf(tank)).toEqual(-1);
            expect(player.units.indexOf(infantry)).toEqual(-1);
        });
        it("should not cleanup unit when of other player", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            tank.player="other";

            //When
            player.destroyed(tank)

            //Then
            expect(player.units.length).toEqual(1);
        });
        it("should deselected when destroyed", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            expect(tank.player).toEqual(player.index);
            player.selectedUnit=tank;

            //When
            player.destroyed(tank)

            //Then
            expect(player.selectedUnit).toEqual(null);
        });
        it("should not deselected when other is destroyed", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var other = new unit("T", {y: 4, x:4});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            expect(tank.player).toEqual(player.index);
            player.selectedUnit=other;

            //When
            player.destroyed(tank)

            //Then
            expect(player.selectedUnit).toEqual(other);
        });
        it("should emit a game state change", function(){
           //Given
            spyOn(MessageBus, "send");
            var tank = new unit("T", {y: 3, x:3}).initTurn();

            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);

            //When
            player.destroyed(tank);

            expect(MessageBus.send).toHaveBeenCalledWith("game-state-changed", 0);
        });
    });
    describe("flash method", function(){
        it("should add a message to the player flash messages", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.messages=["existing"];

            //When
            player.flash("message");

            //Then
            expect(player.messages).toEqual(["existing", "message"]);
        });
    });
    describe("readMessages method", function(){
        it("should return the messages", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.messages=["a", "b"];

            //When
            var result=player.readMessages();

            //Then
            expect(result).toEqual(["a", "b"]);
        });
        it("should clear messages", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.messages=["a", "b"];

            //When
            player.readMessages();

            //Then
            expect(player.messages).toEqual([]);
        });
        it("should return 'No messages' when there are no message", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.messages=[];

            //When
            var result = player.readMessages();

            //Then
            expect(result).toEqual(["No messages"]);
        });
    });
    describe("flashDestruction method", function(){
        it("should report destruction if unit is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 3, x: 2});
            tank.player=0;
            player.messages=[];

            //When
            player.flashDestruction(tank, {name: "Computer", index: 1});

            //Then
            expect(player.messages.pop()).toEqual("The Tank at (3, 2) was destroyed by Computer");
        });
        it("should not report destruction if player is the aggressor", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 3, x: 2});
            tank.player=0;
            player.messages=[];

            //When
            player.flashDestruction(tank, {name: "Computer", index: 0});

            //Then
            expect(player.messages).toEqual([]);
        });
        it("should not report destruction if unit is of other players", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 3, x: 2});
            tank.player=1;
            player.messages=[];

            //When
            player.flashDestruction(tank,{name: "Computer", index: 1});

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("flashCityFallen method", function(){
        it("should report destruction if unit is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            cityInstance.player=0;
            player.messages=[];

            //When
            player.flashCityFallen({city: cityInstance}, {name: "Computer"});

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) is fallen into the control of Computer");
        });
        it("should not report destruction if unit is of other players", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city("Tiel", {y: 3, x: 2});
            cityInstance.player=1;
            player.messages=[];

            //When
            player.flashCityFallen({city: city});

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("flashAttack method", function(){
        it("should report attack if unit is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 3, x: 2});
            tank.player=0;
            player.messages=[];

            //When
            player.flashAttack(tank,5);

            //Then
            expect(player.messages.pop()).toEqual("The Tank at (3, 2) was attacked and received 5 points of damage");
        });
        it("should not report attack if unit is of other players", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 3, x: 2});
            tank.player=1;
            player.messages=[];

            //When
            player.flashAttack(tank);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("unitLoaded method", function(){
        it("should deselect the unit", function(){
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank  = new unit("T", {y: 1, x: 1});
            tank.player=0;
            tank.inside=new unit("t", {y: 1, x: 1});
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", tank);

            expect(player.cursorSelect).toHaveBeenCalledWith(tank);
        });
         it("should not deselect the unit when loaded inside a city", function(){
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank  = new unit("T", {y: 1, x: 1});
             tank.player=0;
             tank.inside=new city({y: 1, x: 1}, "Tiel");
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", tank);

            expect(player.cursorSelect).not.toHaveBeenCalledWith(tank);
        });
        it("should not select the unit if the unit is of an different player", function(){
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var tank = new unit("T", {y: 1, x: 1});
            tank.player=1;
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", tank);

            expect(player.cursorSelect).not.toHaveBeenCalledWith(tank);
        });
    });
     describe("flashUnitCreationSuspended method", function(){
        it("should report creation suspended if city is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            cityInstance.player=0;
            player.messages=[];

            //When
            player.flashUnitCreationSuspended(cityInstance, unitTypes['b']);

            //Then
            expect(player.messages.pop()).toEqual("The creation of a Battle ship was suspended. The city of Tiel(3, 2) has reached is maximum garnison size. Move units out of the city to make room.");
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            cityInstance.player=1;
            player.messages=[];

            //When
            player.flashUnitCreationSuspended(cityInstance, unitTypes['*']);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
     describe("flashUnitCreated method", function(){
        it("should report creation suspended if city is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var tank = new unit("T");
            tank.player=0;
            player.messages=[];

            //When
            player.flashUnitCreated(cityInstance, tank);

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) has build a Tank.");
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var tank = new unit("T");
            tank.player=1;
            player.messages=[];

            //When
            player.flashUnitCreated(cityInstance, tank);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("registerUnit method", function(){
        it("should add unit to player units", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var tank = new unit("T");
            tank.player=0;
            player.messages=[];

            //When
            player.registerUnit(cityInstance, tank);

            //Then
            expect(player.units.pop()).toEqual(tank);
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var tank = new unit("T");
            tank.player=1;
            player.messages=[];

            //When
            player.registerUnit(cityInstance, tank);

            //Then
            expect(player.units.length).toEqual(0);
        });
    });
    describe("initTurn method", function(){
          it("should init all units", function(){
              var a = new unit("T", {y: 3, x:3});
              var b = new unit("T", {y: 3, x:4});
              var units = [a,b];
              var player = new humanPlayer(0, "0", "Name", "Color",units, map);
              spyOn(a,"initTurn");
              spyOn(b,"initTurn");

              player.initTurn();

              expect(a.initTurn).toHaveBeenCalled();
              expect(b.initTurn).toHaveBeenCalled();
          });
          it("should clear the spotted enemies of the previous turn", function(){
              var friend = new unit("T", {y: 3, x:3});
              var foe = new unit("T", {y: 3, x:4});
              var units = [friend];
              var player = new humanPlayer(0, "0", "Name", "Color",units, map);
              player.enemySpottedThisTurn={friend: [foe]};

              player.initTurn();

              expect(player.enemySpottedThisTurn).toEqual({});
          });
      });
    describe("enemySpotted", function(){
        it("should mark enemy contacted on first spot", function(){
          var friend = new unit("T", {y: 3, x:3});
          var foe = new unit("T", {y: 3, x:4});
          var units = [friend];
          var player = new humanPlayer(0, "0", "Name", "Color",units, map);
          player.enemySpottedThisTurn={};
          player.contactedEnemy=false;

          player.enemySpotted([foe], friend);

          expect(player.contactedEnemy).toBeTruthy();
        });
        it("should register the enemy spotted by that unit", function(){
          var friend = new unit("T", {y: 3, x:3});
          var foe = new unit("T", {y: 3, x:4});
          var units = [friend];
          var player = new humanPlayer(0, "0", "Name", "Color",units, map);
          player.enemySpottedThisTurn={};

          player.enemySpotted([foe], friend);

          expect(player.enemySpottedThisTurn[friend][0]).toEqual(foe);
        });
        it("should add spotted enemies", function(){
          var friend = new unit("T", {y: 3, x:3});
          var foe1 = new unit("T", {y: 3, x:4});
          var foe2 = new unit("F", {y: 4, x:4});
          var units = [friend];
          var player = new humanPlayer(0, "0", "Name", "Color",units, map);
          player.enemySpottedThisTurn={};
          player.enemySpottedThisTurn[friend]=[foe1];
          player.enemySpotted([foe2], friend);

          expect(player.enemySpottedThisTurn[friend][0]).toEqual(foe1);
          expect(player.enemySpottedThisTurn[friend][1]).toEqual(foe2);
        });
    });
    describe("endTurn method", function(){
        it("should call endTurn on all methods", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3}),new city({y: 3, x:3})];
            var player = new humanPlayer(0, "0",  "Name", "Color",units, map);
            spyOn(units[0], "endTurn");
            spyOn(units[1], "endTurn");
            //When
            player.endTurn();

            //Then
            expect(units[0].endTurn).toHaveBeenCalledWith()
            expect(units[1].endTurn).toHaveBeenCalledWith()
        });
    });
    describe("flashAttack method", function(){
        it("should report non production when city is of player", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2},"Tiel");
            cityInstance.player=0;
            player.messages=[];

            //When
            player.flashCityNotProducing(cityInstance,5);

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) isn't producing any units.");
        });
        it("should not report non production if city is of other players", function(){
            //Given
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            var cityInstance = new city({y: 3, x: 2},"Tiel");
            cityInstance.player=1;
            player.messages=[];

            //When
            player.flashCityNotProducing(cityInstance,5);


            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("specialAction method", function(){
        it("should apply special action on unit", function(){
            //Given
            var infantry = new unit("I", {x: 3, y:3});
            var units = [
                infantry,
                new unit("T", {x: 13, y:12}),
                new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.selectedUnit=infantry;
            spyOn(infantry, "fortify");

            //When
            player.specialAction("fortify")

            //Then
            expect(infantry.fortify).toHaveBeenCalled();
        });
         it("should apply update fogOfWar to cope with sight changes", function(){
            //Given
             var infantry = new unit("I", {x: 3, y:3}).initTurn();
                         var units = [
                             infantry,
                             new unit("T", {x: 13, y:12}),
                             new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.selectedUnit=infantry;
            spyOn(player.fogOfWar, "remove");
            spyOn(player.fogOfWar, "add");

            //When
            player.specialAction("fortify")

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalledWith(infantry);
            expect(player.fogOfWar.add).toHaveBeenCalledWith(infantry);
        });
        it("should ask to clear the order when manual move is made on a unit with an order", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            var units = [tank];
            var player = new humanPlayer(0, "0", "Name", "Color",units, map);
            player.selectedUnit=tank;
            tank.order="some order"
            spyOn(MessageBus, "send")

            //When
            var result = player.specialAction("fortify");

            //Then
            expect(tank.fortified).toBeFalsy();
            expect(MessageBus.send).toHaveBeenCalledWith("confirm-order", tank);
        });
        it("should proceed with next unit", function(){
            //Given
             var infantry = new unit("I", {x: 3, y:3}).initTurn();
                         var units = [
                             infantry,
                             new unit("T", {x: 13, y:12}),
                             new unit("F", {x: 7, y:7})];
            var player = new humanPlayer(0, "0", "Name", "Color", [], map);
            player.selectedUnit=infantry;
            spyOn(player, "jumpToNextUnit");

            //When
            player.specialAction("fortify")

            //Then
            expect(player.jumpToNextUnit).toHaveBeenCalledWith(infantry);
        });
    });
    describe("constructor", function(){
        it("should assign player to all units", function(){
            //Given
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            //Then
            expect(a.player).toEqual(42);
            expect(b.player).toEqual(42);
        });
        it("should add all units to fog of war", function(){
            //Given
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            //Then
            expect(player.fogOfWar.visible({y: 3, x: 3})).toBeTruthy();
            expect(player.fogOfWar.visible({y: 3, x: 4})).toBeTruthy();
        });
    });
    describe("autoNext method", function(){
        it("should return false when flag is false and turn is not in end phase", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            player.autoNextFlag=false;
            player.endTurnPhase=false;

            var result = player.autoNext();

            expect(result).toBeFalsy();
        });
        it("should return true when flag is true and turn is not in end phase", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            player.autoNextFlag=true;
            player.endTurnPhase=false;

            var result = player.autoNext();

            expect(result).toBeTruthy();
        });
        it("should return true when flag is false and turn is in end phase", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            player.autoNextFlag=false;
            player.endTurnPhase=true;

            var result = player.autoNext();

            expect(result).toBeTruthy();
        });
    });
    describe("hasAnyUnits method", function(){
        it("should report true when player still has any units and cities", function(){
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b,cityInstance];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            expect(player.hasAnyUnits()).toBeTruthy();
        });
         it("should report true when player still has any units", function(){
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            expect(player.hasAnyUnits()).toBeTruthy();
        });
        it("should report false when player hasn't got any units", function(){
            var units = [];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            expect(player.hasAnyUnits()).toBeFalsy();
        });
    });
    describe("hasAnyCities method", function(){
        it("should report true when player still has any units and cities", function(){
            var cityInstance = new city({y: 3, x: 2}, "Tiel");
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b,cityInstance];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            expect(player.hasAnyCities()).toBeTruthy();
        });
        it("should report false when player hasn't got any cities", function(){
            var a = new unit("T", {y: 3, x:3});
            var b = new unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new humanPlayer(42, "42","Name", "Color",units, map);

            expect(player.hasAnyCities()).toBeFalsy();
        });
    });
    describe("state methods", function(){
        it("should make player loose when called", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            expect(player.hasLost()).toBeFalsy();

            player.looses();

            expect(player.hasLost()).toBeTruthy();
            expect(MessageBus.send).toHaveBeenCalledWith("player-looses", player);
        });
        it("should make player win when called", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            expect(player.hasWon()).toBeFalsy();

            player.wins();

            expect(player.hasWon()).toBeTruthy();
            expect(MessageBus.send).toHaveBeenCalledWith("player-wins", player);
        });
        it("should make player roam when called", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            expect(player.isRoaming()).toBeFalsy();

            player.roaming();

            expect(player.isRoaming()).toBeTruthy();
            expect(player.turnsRoaming).toEqual(10);
            expect(MessageBus.send).toHaveBeenCalledWith("player-roaming", player);
        });
        it("should not reinitialize roaming", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            expect(player.isRoaming()).toBeFalsy();
            player.roaming();
            player.turnsRoaming=2;

            player.roaming();

            expect(player.turnsRoaming).toEqual(2);
        });
        it("should restore the player to normal playing mode when conquered a city", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            player.roaming();

            player.units.push(new city({y: 3, x: 2}, "Tiel"));

            player.updateRoaming();
            
            expect(player.isRoaming()).toBeFalsy();
            expect(player.turnsRoaming).toBeUndefined();
        });
        it("should deduct roaming turns", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(MessageBus, "send");
            player.roaming();

            player.updateRoaming();

            expect(player.isRoaming()).toBeTruthy();
            expect(player.turnsRoaming).toEqual(9);
        });
        it("should make player loose when out of roaming turns", function(){
            var player = new humanPlayer(42, "42","Name", "Color", [], map);
            spyOn(player, "looses");
            player.roaming();
            player.turnsRoaming=1;

            player.updateRoaming();

            expect(player.looses).toHaveBeenCalled();
        });
    });
});