describe("Model.Game", function(){
    var row = [{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'},{type: 'L'}]
    var map = new Model.Map([row, row, row, row, row, row, row, row, row, row, row, row, row, row]);
    
    describe("constructor", function(){
       it("should construct a unitsmap on initialization", function(){
           //Given
           var units = [
                new Model.Unit("T", {x: 3, y:3}),
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
           var players = [new Model.Player(0,"Name", "Color", units)];
           spyOn(Model, "UnitsMap");
           spyOn(Model, "Statistics");

           //When
           var game = new Model.Game("data", players);

           //Then
           expect(Model.UnitsMap).toHaveBeenCalledWith(players, "data");
           expect(_.size(game.statistics)).toEqual(1);
           expect(Model.Statistics).toHaveBeenCalledWith(players[0]);
       });
       it("should set unitsMap on players", function(){
           //Given
           var red = new Model.Player(0,"Red", "Color", []);
           var blue = new Model.Player(0,"Blue", "Color", []);
           var players = [red, blue];
           
           //When
           var game = new Model.Game(map, players);

           //Then
           expect(game.unitsMap).toBeDefined();
           expect(red.unitsMap).toEqual(game.unitsMap);
           expect(blue.unitsMap).toEqual(blue.unitsMap);
       });
    });
    describe("cursorSelect method", function(){
        it("should set the selected unit on the given position on the current user", function(){
            //Given
            var units = [
                new Model.Unit("T", {x: 3, y:3}),
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var game = new Model.Game("data", [player]);
            
            //When
            game.cursorSelect({y: 7, x: 7});

            //Then
            expect(game.currentPlayer().selectedUnit).toEqual(units[2]);
        });
        it("should not set the selected unit on the current user when the unit at hand is of the other user", function(){
            //Given
            var units = [
                new Model.Unit("T", {x: 3, y:3}),
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", units);
            var game = new Model.Game("data", [player]);

            //When
            game.cursorSelect({y: 7, x: 7});

            //Then
            expect(game.currentPlayer().selectedUnit).toBeNull();
        });
        it("should not set the selected unit when none exists on that location", function(){
            //Given
            var units = [
                new Model.Unit("T", {x: 3, y:3}),
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var game = new Model.Game("data", [player]);
            
            //When
            game.cursorSelect({y: 4, x: 4});

            //Then
            expect(game.currentPlayer().selectedUnit).toEqual(null);
        });
    });
    describe("moveInDirection method", function(){
        it("should update current position and set that position", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            game.currentPlayer().position={x: 1, y: 2};
            spyOn(game.data, "move").andReturn({x: 1, y:3});
            spyOn(game, "setPosition");

            //When
            game.moveInDirection("down");

            expect(game.data.move).toHaveBeenCalledWith("down", {x: 1, y:2});
            expect(game.setPosition).toHaveBeenCalledWith({x: 1, y:3});    
        });
    });
    describe("setPosition method", function(){
        it("should update the position on the current player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var position={x: 1, y: 2};
            spyOn(player, "cursorUpdate");
            spyOn(Service.Bus, "send");

            //When
            game.setPosition(position);

            //Then
            expect(player.cursorUpdate).toHaveBeenCalledWith(position);
        });
        it("should update send an update screen request", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            player.position={x: 1, y: 2};
            spyOn(player, "cursorUpdate").andReturn(true);
            spyOn(Service.Bus, "send");

            //When
            game.setPosition(player.position);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("screen-update", {x: 1, y: 2});
        });
        it("should update send an update infobar request when a unit selected", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var position={x: 1, y: 2};
            player.selectedUnit="a unit";
            spyOn(player, "cursorUpdate").andReturn(true);
            spyOn(Service.Bus, "send");

            //When
            game.setPosition(position);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("infobar-update");
        });
        it("should not update send an update screen request when the cursor update failed", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var position={x: 1, y: 2};
            spyOn(player, "cursorUpdate").andReturn(false);
            spyOn(Service.Bus, "send");

            //When
            game.setPosition(position);

            //Then
            expect(Service.Bus.send).not.toHaveBeenCalledWith("screen-update", undefined);
        });
        it("should not update send an update infobar request when a unit selected", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var position={x: 1, y: 2};
            player.selectedUnit="a unit";
            spyOn(player, "cursorUpdate").andReturn(false);
            spyOn(Service.Bus, "send");

            //When
            game.setPosition(position);

            //Then
            expect(Service.Bus.send).not.toHaveBeenCalledWith("infobar-update");
        });
    });
    describe("cityUnderSiege method", function(){
        it("should perform battle with units in city", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new Model.Unit("T", {y:1, x:0});
            var city = new Model.City(at, "Tiel");
            city.nestedUnits=[new Model.Unit("T")]
            spyOn(game,"battle");
            
            //When
            game.cityUnderSiege(attacker, city, at);

            //Then
            expect(game.battle).toHaveBeenCalledWith(attacker, city.nestedUnits[0],at);
        });
        it("should perform battle with units in city even when the attacker isn't a ground force", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new Model.Unit("T", {y:1, x:0});
            var city = new Model.City(at, "Tiel");
            city.nestedUnits=[new Model.Unit("T")]
            spyOn(game,"battle");

            //When
            game.cityUnderSiege(attacker, city, at);

            //Then
            expect(game.battle).toHaveBeenCalledWith(attacker, city.nestedUnits[0],at);
        });
        it("should perform battle with city defense when no units present", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new Model.Unit("T", {y:1, x:0});
            var city = new Model.City(at, "Tiel");
            spyOn(city, "siege").andReturn("city-defense")
            spyOn(game,"battle");

            //When
            game.cityUnderSiege(attacker, city, at);

            //Then
            expect(game.battle).toHaveBeenCalledWith(attacker, "city-defense",at, true);
        });
        it("should not take the city when your are not a ground force", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){}}, [player]);
            var at = {y: 1, x:1};
            var attacker = new Model.Unit("F", {y:1, x:0});
            var city = new Model.City(at, "Tiel");
            spyOn(city, "siege").andReturn("city-defense")
            spyOn(game,"battle");

            //When
            game.cityUnderSiege(attacker, city, at);

            //Then
            expect(game.battle).not.toHaveBeenCalled();
        });
    });
    describe("battle method", function(){
        it("should perform an battle between the attacker and the defender", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){},position: function(){}}, [player]);
            var attacker = new Model.Unit("T", {y:1, x: 2});
            var defender = new Model.Unit("T", {y:2, x: 2});
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(Model,"Battle").andReturn(battle);
            spyOn(battle, "fight").andReturn({});
            spyOn(Service.Bus, "send");
            //When
            game.battle(attacker, defender, at);

            //Then
            expect(Model.Battle).toHaveBeenCalledWith(attacker, defender, [], []);
            expect(battle.fight).toHaveBeenCalled();
        });
        it("should perform an battle and include the modfiers", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){},position: function(){return "Land"}}, [player]);
            var attacker = new Model.Unit("T", {y:1, x: 2});
            var defender = new Model.Unit("T", {y:2, x: 2});
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(Model,"Battle").andReturn(battle);
            spyOn(battle, "fight").andReturn({});
            spyOn(Service.Bus, "send");

            spyOn(attacker, "modifiers").andReturn("attacker modifiers");
            spyOn(defender, "modifiers").andReturn("defender modifiers");
                        

            //When
            game.battle(attacker, defender, at);

            //Then
            expect(attacker.modifiers).toHaveBeenCalledWith(defender, "Land");
            expect(defender.modifiers).toHaveBeenCalledWith(attacker, "Land");
            expect(Model.Battle).toHaveBeenCalledWith(attacker, defender, "attacker modifiers", "defender modifiers");
        });
        it("should destroy the defender and move the attacker to the new position when attacker wins", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){},position: function(){}}, [player]);
            var attacker = new Model.Unit("T", {y:1, x: 2});
            attacker.health=1;
            var defender = new Model.Unit("T", {y:2, x: 2});
            defender.health=0;
            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(Model,"Battle").andReturn(battle);
            spyOn(battle, "fight").andReturn({rounds: "battleresults"});
            spyOn(Service.Bus, "send");
            //When
            game.battle(attacker, defender, at,true);

            //Then
            expect(Service.Bus.send.calls[0].args).toEqual(["battle-results", attacker, defender, {rounds: "battleresults"}]);
            expect(Service.Bus.send.calls[1].args).toEqual(["unit-destroyed", defender, game.currentPlayer(), false]);
            expect(Service.Bus.send.calls[2].args).toEqual(["move-unit", attacker, at, true]);
        });
        it("should destroy the attacker when defender wins", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game({move: function(){},position: function(){}}, [player]);
            var attacker = new Model.Unit("T", {y:1, x: 2});
            attacker.health=0;
            var defender = new Model.Unit("T", {y:2, x: 2});
            defender.health=1;

            var at = {y: 1, x:1};
            var battle = {fight: function(){}};
            spyOn(Model,"Battle").andReturn(battle);
            spyOn(battle, "fight").andReturn({rounds: "battleresults", defenderDamage: 3});
            spyOn(Service.Bus, "send");
            //When
            game.battle(attacker, defender, at);

            //Then
            expect(Service.Bus.send.calls[0].args).toEqual(["battle-results", attacker, defender, {rounds: "battleresults", defenderDamage: 3}]);
            expect(Service.Bus.send.calls[1].args).toEqual(["unit-attacked", defender, 3]);
            expect(Service.Bus.send.calls[2].args).toEqual(["unit-destroyed", attacker, game.currentPlayer(), true]);
                        
        });
    });
    describe("nextUnit method", function(){
        var units = [
            new Model.Unit("T", {x: 3, y:3}),
            new Model.Unit("T", {x: 13, y:12}),
            new Model.Unit("F", {x: 7, y:7})
        ];

        var data = {x:"X",move: function(){}};
        var player = new Model.Player(0,"Name", "Color", units);
        var other = new Model.Player(0,"Name", "Color", []);
        var game = new Model.Game(data, [player, other]);

        it("should select next unit", function(){
            //Given
            spyOn(player.carrousel, "next").andReturn("next unit");
            spyOn(game, "selectUnit");
            spyOn(Service.Bus, "send");
            
            //When
            game.nextUnit();

            //Then
            expect(player.carrousel.next).toHaveBeenCalled();
            expect(game.selectUnit).toHaveBeenCalledWith("next unit")
        });
        it("should send bus event that next unit is selected", function(){
            //Given
            spyOn(player.carrousel, "next").andReturn("next unit");
            spyOn(game, "selectUnit");
            spyOn(Service.Bus, "send");

            //When
            game.nextUnit();

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("next-unit-updated","next unit")
        });
        it("should execute the order of the selected unit", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 6, x: 3}).initTurn();
            infantry.player=0;
            infantry.order={action: "direction", direction: "N"};
            spyOn(player.carrousel, "next").andReturn(infantry);
            spyOn(game, "selectUnit");
            spyOn(Service.Bus, "send");
            spyOn(game.unitsMap, "move");
            spyOn(data, "move").andReturn("direction");

            //When
            game.nextUnit();

            //Then
            expect(game.unitsMap.move).toHaveBeenCalled()
        });
    });
    describe("nextTurn method", function(){
        it("should hand over turn to other player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            expect(game.currentPlayer()).toEqual(player);
            var currentTurn = game.turn;
            
            //When
            game.nextTurn();

            //Then
            expect(game.currentPlayer()).toEqual(other);
            expect(game.turn).toEqual(currentTurn);
        });
        it("should hand over turn to first player and increase turn when last player in turn is done", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            game.currentPlayerIndex=1;
            expect(game.currentPlayer()).toEqual(other);
            var currentTurn = game.turn;

            //When
            game.nextTurn();

            //Then
            expect(game.currentPlayer()).toEqual(player);
            expect(game.turn).toEqual(currentTurn+1);
        });
        it("should init turn of new player", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            expect(game.currentPlayer()).toEqual(player);
            spyOn(other, "initTurn");
            
            //When
            game.nextTurn();

            //Then
            expect(other.initTurn).toHaveBeenCalled();
        });
        it("should trigger a new turn dialog", function(){
            //Given
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            other.messages=["No messages"]
            expect(game.currentPlayer()).toEqual(player);
            spyOn(Service.Bus, "send");
            
            //When
            game.nextTurn();

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("new-turn", ["No messages"],0);
        });
    });
    describe("cityConquered method", function(){
        it("should transfer city", function(){
            //Given
            var city =  new Model.City("Tiel", {x: 4, y:8});
            var player = new Model.Player(0,"Name", "Color", [city]);
            var other = new Model.Player(1,"Name", "Color", []);
            spyOn(city, "conquered").andCallThrough();
            var game = new Model.Game("data", [player, other]);

            //When
            game.cityConquered({city: city}, other);

            //Then
            expect(city.conquered).toHaveBeenCalledWith(1);
            expect(player.units.length).toEqual(0);
            expect(other.units.length).toEqual(1);
            expect(other.units[0]).toEqual(city);
        });
        it("should claim neutral city", function(){
            //Given
            var city =  new Model.City("Tiel", {x: 4, y:8});
            var player = new Model.Player(0,"Name", "Color", [city]);
            spyOn(city, "conquered").andCallThrough();
            var game = new Model.Game("data", [player]);

            //When
            game.cityConquered({city: city}, player);

            //Then
            expect(city.conquered).toHaveBeenCalledWith(0);
            expect(player.units.length).toEqual(1);
        });
        it("should update fog of war", function(){
            //Given
            var city =  new Model.City("Tiel", {x: 4, y:8});
            var player = new Model.Player(0,"Name", "Color", [city]);
            var other = new Model.Player(1,"Name", "Color", []);
            spyOn(player.fogOfWar, "remove");
            spyOn(other.fogOfWar, "add");
            var game = new Model.Game("data", [player, other]);

            //When
            game.cityConquered({city: city}, other);

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalledWith(city);
            expect(other.fogOfWar.add).toHaveBeenCalledWith(city);
            
        });
    });
    describe("specialAction method", function(){
        it("should delegate call to player", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            var units = [
                infantry,
                new Model.Unit("T", {x: 13, y:12}),
                new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", []);
            var other = new Model.Player(0,"Name", "Color", units);
            var game = new Model.Game("data", [player]);
            player.selectedUnit=infantry;
            spyOn(player, "specialAction");
            
            //When
            game.specialAction(infantry, "fortify")

            //Then
            expect(player.specialAction).toHaveBeenCalledWith("fortify");
        });
        it("should update the screen", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0; 
                         var units = [
                             infantry,
                             new Model.Unit("T", {x: 13, y:12}),
                             new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.position="position";
            other.position="other position";
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.specialAction(infantry, "fortify")

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("screen-update", "position");
        });
        it("should update the infobar when unit is selected", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
                         var units = [
                             infantry,
                             new Model.Unit("T", {x: 13, y:12}),
                             new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.position="position";
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.specialAction(infantry, "fortify")

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("infobar-update");
        });
        it("should not update the infobar when unit is not selected", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
                         var units = [
                             infantry,
                             new Model.Unit("T", {x: 13, y:12}),
                             new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.position="position";
            player.selectedUnit=null;
            spyOn(Service.Bus, "send");

            //When
            game.specialAction(infantry, "fortify")

            //Then
            expect(Service.Bus.send).not.toHaveBeenCalledWith("infobar-update");
        });
    });
    describe("revokeOrder method", function(){
        it("should revoke order of the selected unit", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.revokeOrder(true);

            //Then
            expect(infantry.order).toBeNull();
        });
        it("should revoke order of the selected unit", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.revokeOrder(true);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("order-revoked");
        });
        it("should ask for confirmation of revoking of order when command is not confirmed", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.revokeOrder(false);

            //Then
            expect(infantry.order).toEqual("the order");
            expect(Service.Bus.send).toHaveBeenCalledWith("confirm-order", infantry);
        });
        it("should handle no selected unit", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            infantry.order="the order";
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=null;
            spyOn(Service.Bus, "send");
            
            //When
            game.revokeOrder(true);

            //Then
            //no smoke
        });
    });
    describe("giveOrder method", function(){
        it("should set order on a unit", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("move", "queue", null, true);

            //Then
            expect(infantry.order).toEqual({ action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should emit order given event", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("move", "queue", null, true);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("order-given", { action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should execute the selected order", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game(map, [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("direction", null, "S", true);

            //Then
            expect(infantry.derivedPosition()).toEqual({x: 3, y: 4});
        });
        it("should ask for confirmation when the given order is not confirmed", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("move", "queue", null, false);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(Service.Bus.send).toHaveBeenCalledWith("confirm-order", infantry, { action : 'move', queue : 'queue', direction: null, from : 'q', to : 'e' } );
        });
        it("should set not set an order on a unit when there is no unit selected", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=null;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("move", "queue", null, true);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(Service.Bus.send).not.toHaveBeenCalledWith()
        });
        it("should set not set an order on a unit when there is no action", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3}).initTurn();
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder(null, "queue", null, true);

            //Then
            expect(infantry.order).toBeFalsy();
            expect(Service.Bus.send).not.toHaveBeenCalledWith()
        });
        it("should set set an order on a unit when there is no path", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.player=0;
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units);
            var other = new Model.Player(1,"Name", "Color", []);
            var game = new Model.Game("data", [player, other]);
            player.selectedUnit=infantry;
            spyOn(Service.Bus, "send");

            //When
            game.giveOrder("roam", null, null, true);

            //Then
            expect(infantry.order).toEqual({action: "roam", direction: null, queue: null})
            expect(Service.Bus.send).toHaveBeenCalledWith("order-given", {action: "roam", direction: null, queue: null});
        });
    });
    describe("endTurn method", function(){
        it("should initiated end the turn phase when there are moveable units", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            var units = [
                 infantry,
                 new Model.Unit("T", {x: 13, y:12}),
                 new Model.Unit("F", {x: 7, y:7})];
            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);
            spyOn(Service.Bus,"send");
            infantry.movesLeft=1;
            
            //When
            game.endTurn();

            ///Then
            expect(Service.Bus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should end the turn when there are no moveable units", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            var units = [infantry];
            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);
            spyOn(Service.Bus,"send");
            infantry.movesLeft=0;

            //When
            game.endTurn();

            ///Then
            expect(Service.Bus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should end the turn when there are no moveable units with orders", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);
            spyOn(Service.Bus,"send");
            infantry.movesLeft=0;
       
            //When
            game.endTurn();

            ///Then
            expect(Service.Bus.send).toHaveBeenCalledWith("end-turn");
        });
        it("should proceed to end of the turn phase when there are  moveable units with orders", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);
            spyOn(Service.Bus,"send");
            infantry.movesLeft=1;
            
            //When
            game.endTurn();

            ///Then
            expect(Service.Bus.send).toHaveBeenCalledWith("end-of-turn-phase");
        });
        it("should end of the turn phase flag on the player when there are  moveable units with orders", function(){
            //Given
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry];
            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);
            spyOn(Service.Bus,"send");
            infantry.movesLeft=1;
            player.endTurnPhase=false;
            //When
            game.endTurn();

            ///Then
            expect(player.endTurnPhase).toEqual(true);
        });
    });
    describe("winOrLoose method", function(){
        it("should declare a loss when a player is without cities and units", function(){
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry, new Model.City({y: 3, x: 2}, "Tiel")];

            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);

            spyOn(Service.Bus, "send");

            game.winOrLoose(1);

            expect(Service.Bus.send).toHaveBeenCalledWith("player-looses", other);
        });
        it("should declare a win when a player the only one not lost", function(){
            var infantry = new Model.Unit("I", {x: 3, y:3});
            infantry.order="order";
            var units = [infantry, new Model.City({y: 3, x: 2}, "Tiel")];

            var player = new Model.Player(0,"Name", "Color", units).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var game = new Model.Game("data", [player, other]);

            spyOn(Service.Bus, "send");

            game.winOrLoose(1);

            expect(Service.Bus.send).toHaveBeenCalledWith("player-wins", player);
            expect(player.hasWon()).toBeTruthy();
            expect(other.hasLost()).toBeTruthy();
        });
        it("should not declare a win when there are other players that haven't lost not lost", function(){
            var infantry1 = new Model.Unit("I", {x: 3, y:3});
            var infantry2 = new Model.Unit("I", {x: 2, y:2});


            var player = new Model.Player(0,"Name", "Color", [infantry1, new Model.City({y: 3, x: 2}, "Tiel")]).initTurn();
            var other = new Model.Player(1,"Name", "Color", []).initTurn();
            var left = new Model.Player(2,"Name", "Color", [infantry2, new Model.City({y: 2, x: 3}, "Tiel")]).initTurn();
            var game = new Model.Game("data", [player, other,left]);

            spyOn(Service.Bus, "send");

            game.winOrLoose(1);

            expect(Service.Bus.send).not.toHaveBeenCalledWith("player-wins", player);
            expect(!player.hasWon() && !player.hasLost()).toBeTruthy();
            expect(!left.hasWon() && !left.hasLost()).toBeTruthy();
            expect(other.hasLost()).toBeTruthy();
        });
        
    });
});