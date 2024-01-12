describe("Model.Player class", function(){
    describe("cursorSelect method", function(){
        it("should set the selected unit on the given position", function(){
            //Given
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0, "Name", "Color", units);

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(units[0]);
        });
        it("should clear the selected unit when the same unit is selected ", function(){
            //Given
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0, "Name", "Color", units);
            player.selectedUnit=units[0];

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(null);
        });
        it("should update the selected unit when a other unit is selected ", function(){
            //Given
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0, "Name", "Color", units);
            player.selectedUnit=new Model.Unit("T", {y:13, x:12});

            //When
            player.cursorSelect(units[0]);

            //Then
            expect(player.selectedUnit).toEqual(units[0]);
        });
    });
    describe("updateSelectedUnit", function(){
        it("should reschedule old unit when unit is updated", function(){
            var unit = new Model.Unit("T", {y: 3, x:3}).initTurn();
            var player = new Model.Player(0, "Name", "Color", [unit]);
            player.selectedUnit=unit;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).toHaveBeenCalledWith(unit);
        });
        it("should not reschedule old unit when old unit is out of move", function(){
            var unit = new Model.Unit("T", {y: 3, x:3}).initTurn();
            unit.movesLeft=0;
            var player = new Model.Player(0, "Name", "Color", [unit]);
            player.selectedUnit=unit;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).not.toHaveBeenCalledWith(unit);
        });
        it("should hanlde no old unit scenario", function(){
            var player = new Model.Player(0, "Name", "Color", []);
            player.selectedUnit=null;
            spyOn(player.carrousel, "reschedule");

            player.updateSelectedUnit("other");

            expect(player.carrousel.reschedule).not.toHaveBeenCalled();
        });
    });
    describe("cursorUpdate method", function(){
        it("should not change anything when no unit is selected", function(){
            //Given
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0,"Name", "Color", units);
            spyOn(Service.Bus, "send")
            //When
            var success = player.cursorUpdate({y: 3, x: 4});

            //Then
            expect(success).toBeTruthy();
            expect(player.position).toEqual({y: 3, x:4});
            expect(units[0].position).toEqual({y: 3, x:3});
            expect(Service.Bus.send).not.toHaveBeenCalled();
        });
        it("should update the position of the selected unit", function(){
            //Given
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0,"Name", "Color", units);
            player.unitsMap = new Model.UnitsMap();
            player.selectedUnit=units[0];
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
            var units = [new Model.Unit("T", {y: 3, x:3})];
            var player = new Model.Player(0,"Name", "Color", units);
            player.selectedUnit=units[0];
            player.unitsMap = new Model.UnitsMap();
            spyOn(player.unitsMap, "move")
            spyOn(player.fogOfWar, "remove");
            spyOn(player.fogOfWar, "add");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalled();
            expect(player.fogOfWar.remove.mostRecentCall.args[0].position).toEqual({y: 3, x:3});
            expect(player.fogOfWar.add).toHaveBeenCalled();
        });
        it("should proceed to next unit", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            player.selectedUnit=units[0];
            player.unitsMap = new Model.UnitsMap();
            spyOn(player.unitsMap, "move").andReturn(true)

            spyOn(player,"jumpToNextUnit");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.jumpToNextUnit).toHaveBeenCalledWith(unit);
        });
        it("should proceed to next unit when move failed", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            player.selectedUnit=units[0];
            player.unitsMap = new Model.UnitsMap();
            spyOn(player.unitsMap, "move").andReturn(false)

            spyOn(player,"jumpToNextUnit");
            //When
            var result = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(player.jumpToNextUnit).not.toHaveBeenCalledWith();
        });
        it("should ask to clear the order when manual move is made on a unit with an order", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            player.selectedUnit=unit;
            player.position = {y: 3, x: 3};
            unit.order="some order"
            spyOn(Service.Bus, "send")

            //When
            var success = player.cursorUpdate({y: 4, x: 4});

            //Then
            expect(success).toBeFalsy();
            expect(player.position).toEqual({y: 3, x:3});
            expect(units[0].position).toEqual({y: 3, x:3});
            expect(Service.Bus.send).toHaveBeenCalledWith("confirm-order", unit);
        });
    });
    describe("destroyed method", function(){
        it("should cleanup unit", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            expect(unit.player).toEqual(player.index);

            //When
            player.destroyed(unit)

            //Then
            expect(_.indexOf(player.units, unit)).toEqual(-1);
        });
        it("should cleanup unit loaded untis", function(){
            //Given
            var transport = new Model.Unit("t", {y: 3, x:3});
            var tank = new Model.Unit("T", {y: 3, x:3}).initTurn();
            var infantry = new Model.Unit("I", {y: 3, x:3}).initTurn();
            transport.load(tank);
            transport.load(infantry);

            var units = [transport, tank, infantry];
            var player = new Model.Player(0,"Name", "Color", units);
            
            //When
            player.destroyed(transport)

            //Then
            expect(_.indexOf(player.units, tank)).toEqual(-1);
            expect(_.indexOf(player.units, infantry)).toEqual(-1);
        });
        it("should not cleanup unit when of other player", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            unit.player="other";

            //When
            player.destroyed(unit)

            //Then
            expect(player.units.length).toEqual(1);
        });
        it("should deselected when destroyed", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            expect(unit.player).toEqual(player.index);
            player.selectedUnit=unit;
            
            //When
            player.destroyed(unit)

            //Then
            expect(player.selectedUnit).toEqual(null);
        });
        it("should not deselected when other is destroyed", function(){
            //Given
            var unit = new Model.Unit("T", {y: 3, x:3});
            var other = new Model.Unit("T", {y: 4, x:4});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            expect(unit.player).toEqual(player.index);
            player.selectedUnit=other;

            //When
            player.destroyed(unit)

            //Then
            expect(player.selectedUnit).toEqual(other);
        });
        it("should emit a game state change", function(){
           //Given
            spyOn(Service.Bus, "send");
            var tank = new Model.Unit("T", {y: 3, x:3}).initTurn();

            var units = [tank];
            var player = new Model.Player(0,"Name", "Color", units);

            //When
            player.destroyed(tank);

            expect(Service.Bus.send).toHaveBeenCalledWith("game-state-changed", 0);
        });
    });
    describe("flash method", function(){
        it("should add a message to the player flash messages", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
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
            var player = new Model.Player(0,"Name", "Color", []);
            player.messages=["a", "b"];

            //When
            var result=player.readMessages();

            //Then
            expect(result).toEqual(["a", "b"]);
        });
        it("should clear messages", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            player.messages=["a", "b"];

            //When
            player.readMessages();

            //Then
            expect(player.messages).toEqual([]);
        });
        it("should return 'No messages' when there are no message", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
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
            var player = new Model.Player(0,"Name", "Color", []);
            var unit = new Model.Unit("T", {y: 3, x: 2});
            unit.player=0;
            player.messages=[];

            //When
            player.flashDestruction(unit, {name: "Computer", index: 1});

            //Then
            expect(player.messages.pop()).toEqual("The Tank at (3, 2) was destroyed by Computer");
        });
        it("should not report destruction if player is the aggressor", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var unit = new Model.Unit("T", {y: 3, x: 2});
            unit.player=0;
            player.messages=[];

            //When
            player.flashDestruction(unit, {name: "Computer", index: 0});

            //Then
            expect(player.messages).toEqual([]);
        });
        it("should not report destruction if unit is of other players", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var unit = new Model.Unit("T", {y: 3, x: 2});
            unit.player=1;
            player.messages=[];

            //When
            player.flashDestruction(unit,{name: "Computer", index: 1});

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("flashCityFallen method", function(){
        it("should report destruction if unit is of player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            city.player=0;
            player.messages=[];

            //When
            player.flashCityFallen({city: city}, {name: "Computer"});

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) is fallen into the control of Computer");
        });
        it("should not report destruction if unit is of other players", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City("Tiel", {y: 3, x: 2});
            city.player=1;
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
            var player = new Model.Player(0,"Name", "Color", []);
            var unit = new Model.Unit("T", {y: 3, x: 2});
            unit.player=0;
            player.messages=[];

            //When
            player.flashAttack(unit,5);

            //Then
            expect(player.messages.pop()).toEqual("The Tank at (3, 2) was attacked and received 5 points of damage");
        });
        it("should not report attack if unit is of other players", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var unit = new Model.Unit("T", {y: 3, x: 2});
            unit.player=1;
            player.messages=[];

            //When
            player.flashAttack(unit);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("unitLoaded method", function(){
        it("should deselect the unit", function(){
            var player = new Model.Player(0,"Name", "Color", []);
            var unit  = new Model.Unit("T", {y: 1, x: 1});
            unit.player=0;
            unit.inside=new Model.Unit("t", {y: 1, x: 1});
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", unit);

            expect(player.cursorSelect).toHaveBeenCalledWith(unit);
        });
         it("should not deselect the unit when loaded inside a city", function(){
            var player = new Model.Player(0,"Name", "Color", []);
            var unit  = new Model.Unit("T", {y: 1, x: 1});
            unit.player=0;
            unit.inside=new Model.City({y: 1, x: 1}, "Tiel");
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", unit);

            expect(player.cursorSelect).not.toHaveBeenCalledWith(unit);
        });
        it("should not select the unit if the unit is of an different player", function(){
            var player = new Model.Player(0,"Name", "Color", []);
            var unit  = new Model.Unit("T", {y: 1, x: 1});
            unit.player=1;
            spyOn(player, 'cursorSelect');

            player.unitLoaded("at", unit);

            expect(player.cursorSelect).not.toHaveBeenCalledWith(unit);
        });
    });
     describe("flashUnitCreationSuspended method", function(){
        it("should report creation suspended if city is of player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            city.player=0;
            player.messages=[];

            //When
            player.flashUnitCreationSuspended(city, Model.UnitTypes['b']);

            //Then
            expect(player.messages.pop()).toEqual("The creation of a Battle ship was suspended. The city of Tiel(3, 2) has reached is maximum garnison size. Move units out of the city to make room.");
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            city.player=1;
            player.messages=[];

            //When
            player.flashUnitCreationSuspended(city, Model.UnitTypes['*']);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
     describe("flashUnitCreated method", function(){
        it("should report creation suspended if city is of player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var unit = new Model.Unit("T");
            unit.player=0;
            player.messages=[];

            //When
            player.flashUnitCreated(city, unit);

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) has build a Tank.");
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var unit = new Model.Unit("T");
            unit.player=1;
            player.messages=[];

            //When
            player.flashUnitCreated(city, unit);

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("registerUnit method", function(){
        it("should add unit to player units", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var unit = new Model.Unit("T");
            unit.player=0;
            player.messages=[];

            //When
            player.registerUnit(city, unit);

            //Then
            expect(player.units.pop()).toEqual(unit);
        });
        it("should not report creation suspended if city is of other player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var unit = new Model.Unit("T");
            unit.player=1;
            player.messages=[];

            //When
            player.registerUnit(city, unit);

            //Then
            expect(player.units.length).toEqual(0);
        });
    });
    describe("initTurn method", function(){
          it("should init all units", function(){
              var a = new Model.Unit("T", {y: 3, x:3});
              var b = new Model.Unit("T", {y: 3, x:4});
              var units = [a,b];
              var player = new Model.Player(0,"Name", "Color", units);
              spyOn(a,"initTurn");
              spyOn(b,"initTurn");

              player.initTurn();

              expect(a.initTurn).toHaveBeenCalled();
              expect(b.initTurn).toHaveBeenCalled();
          });
          it("should clear the spotted enemies of the previous turn", function(){
              var friend = new Model.Unit("T", {y: 3, x:3});
              var foe = new Model.Unit("T", {y: 3, x:4});
              var units = [friend];
              var player = new Model.Player(0,"Name", "Color", units);
              player.enemySpottedThisTurn={friend: [foe]};

              player.initTurn();

              expect(player.enemySpottedThisTurn).toEqual({});
          });
      });
    describe("enemySpotted", function(){
        it("should mark enemy contacted on first spot", function(){
          var friend = new Model.Unit("T", {y: 3, x:3}).tag(1);
          var foe = new Model.Unit("T", {y: 3, x:4});
          var units = [friend];
          var player = new Model.Player(0,"Name", "Color", units);
          player.enemySpottedThisTurn={};
          player.contactedEnemy=false;

          player.enemySpotted([foe], friend);

          expect(player.contactedEnemy).toBeTruthy();
        });
        it("should register the enemy spotted by that unit", function(){
          var friend = new Model.Unit("T", {y: 3, x:3}).tag(1);
          var foe = new Model.Unit("T", {y: 3, x:4});
          var units = [friend];
          var player = new Model.Player(0,"Name", "Color", units);
          player.enemySpottedThisTurn={};
          
          player.enemySpotted([foe], friend);

          expect(player.enemySpottedThisTurn[friend][0]).toEqual(foe);
        });
        it("should add spotted enemies", function(){
          var friend = new Model.Unit("T", {y: 3, x:3}).tag(1);
          var foe1 = new Model.Unit("T", {y: 3, x:4});
          var foe2 = new Model.Unit("F", {y: 4, x:4});
          var units = [friend];
          var player = new Model.Player(0,"Name", "Color", units);
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
            var units = [new Model.Unit("T", {y: 3, x:3}),new Model.City({y: 3, x:3})];
            var player = new Model.Player(0, "Name", "Color", units);
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
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2},"Tiel");
            city.player=0;
            player.messages=[];

            //When
            player.flashCityNotProducing(city,5);

            //Then
            expect(player.messages.pop()).toEqual("The city of Tiel(3, 2) isn't producing any units.");
        });
        it("should not report non production if city is of other players", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var city = new Model.City({y: 3, x: 2},"Tiel");
            city.player=1;
            player.messages=[];

            //When
            player.flashCityNotProducing(city,5);
            

            //Then
            expect(player.messages).toEqual([]);
        });
    });
    describe("specialAction method", function(){
        it("should apply special action on unit", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            var units = [
                infantry,
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", []);
            player.selectedUnit=infantry;
            spyOn(infantry, "fortify");

            //When
            player.specialAction("fortify")

            //Then
            expect(infantry.fortify).toHaveBeenCalled();
        });
         it("should apply update fogOfWar to cope with sight changes", function(){
            //Given
             var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
                         var units = [
                             infantry,
                             new Model.Unit("T", {x: 13, y:12}),
                             new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", []);
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
            var unit = new Model.Unit("T", {y: 3, x:3});
            var units = [unit];
            var player = new Model.Player(0,"Name", "Color", units);
            player.selectedUnit=unit;
            unit.order="some order"
            spyOn(Service.Bus, "send")

            //When
            var result = player.specialAction("fortify");

            //Then
            expect(unit.fortified).toBeFalsy();
            expect(Service.Bus.send).toHaveBeenCalledWith("confirm-order", unit);
        });
        it("should proceed with next unit", function(){
            //Given
             var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
                         var units = [
                             infantry,
                             new Model.Unit("T", {x: 13, y:12}),
                             new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", []);
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
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            //Then
            expect(a.player).toEqual(42);
            expect(b.player).toEqual(42);
        });
        it("should add all units to fog of war", function(){
            //Given
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            //Then
            expect(player.fogOfWar.visible({y: 3, x: 3})).toBeTruthy();
            expect(player.fogOfWar.visible({y: 3, x: 4})).toBeTruthy();
        });
    });
    describe("autoNext method", function(){
        it("should return false when flag is false and turn is not in end phase", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            player.autoNextFlag=false;
            player.endTurnPhase=false;

            var result = player.autoNext();

            expect(result).toBeFalsy();
        });
        it("should return true when flag is true and turn is not in end phase", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            player.autoNextFlag=true;
            player.endTurnPhase=false;

            var result = player.autoNext();

            expect(result).toBeTruthy();
        });
        it("should return true when flag is false and turn is in end phase", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            player.autoNextFlag=false;
            player.endTurnPhase=true;

            var result = player.autoNext();

            expect(result).toBeTruthy();
        });
    });
    describe("hasAnyUnits method", function(){
        it("should report true when player still has any units and cities", function(){
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b,city];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            expect(player.hasAnyUnits()).toBeTruthy();                        
        });
         it("should report true when player still has any units", function(){
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            expect(player.hasAnyUnits()).toBeTruthy();
        });
        it("should report false when player hasn't got any units", function(){
            var units = [];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            expect(player.hasAnyUnits()).toBeFalsy();
        });
    });
    describe("hasAnyCities method", function(){
        it("should report true when player still has any units and cities", function(){
            var city = new Model.City({y: 3, x: 2}, "Tiel");
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b,city];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            expect(player.hasAnyCities()).toBeTruthy();
        });
        it("should report false when player hasn't got any cities", function(){
            var a = new Model.Unit("T", {y: 3, x:3});
            var b = new Model.Unit("T", {y: 3, x:4});
            var units = [a,b];

            //When
            var player = new Model.Player(42,"Name", "Color", units);

            expect(player.hasAnyCities()).toBeFalsy();
        });
    });
    describe("state methods", function(){
        it("should make player loose when called", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            expect(player.hasLost()).toBeFalsy();

            player.looses();

            expect(player.hasLost()).toBeTruthy();
            expect(Service.Bus.send).toHaveBeenCalledWith("player-looses", player);
        });
        it("should make player win when called", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            expect(player.hasWon()).toBeFalsy();

            player.wins();

            expect(player.hasWon()).toBeTruthy();
            expect(Service.Bus.send).toHaveBeenCalledWith("player-wins", player);
        });
        it("should make player roam when called", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            expect(player.isRoaming()).toBeFalsy();

            player.roaming();

            expect(player.isRoaming()).toBeTruthy();
            expect(player.turnsRoaming).toEqual(10);
            expect(Service.Bus.send).toHaveBeenCalledWith("player-roaming", player);
        });
        it("should not reinitialize roaming", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            expect(player.isRoaming()).toBeFalsy();
            player.roaming();
            player.turnsRoaming=2;

            player.roaming();

            expect(player.turnsRoaming).toEqual(2);
        });
        it("should restore the player to normal playing mode when conquered a city", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            player.roaming();

            player.units.push(new Model.City({y: 3, x: 2}, "Tiel"));

            player.updateRoaming();
            
            expect(player.isRoaming()).toBeFalsy();
            expect(player.turnsRoaming).toBeUndefined();
        });
        it("should deduct roaming turns", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(Service.Bus, "send");
            player.roaming();

            player.updateRoaming();

            expect(player.isRoaming()).toBeTruthy();
            expect(player.turnsRoaming).toEqual(9);
        });
        it("should make player loose when out of roaming turns", function(){
            var player = new Model.Player(42,"Name", "Color", []);
            spyOn(player, "looses");
            player.roaming();
            player.turnsRoaming=1;

            player.updateRoaming();

            expect(player.looses).toHaveBeenCalled();
        });
    });
});