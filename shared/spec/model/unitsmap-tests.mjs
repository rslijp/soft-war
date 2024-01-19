import {unitsMap} from "../../game/units-map.mjs";
import {unit} from "../../game/unit.mjs";
import {humanPlayer} from "../../game/human-player.js";
import {gameMap} from "../../game/game-map.js";
import {city} from "../../game/city.mjs";
import {default as MessageBus} from "../../services/message-service.mjs";

describe("unitsMap", function(){
    var dummyMapRaw = [];
    for(var i=0;i<5;i++){
        dummyMapRaw[i]=[];
        for(var j=0;j<5;j++){
            dummyMapRaw[i][j]="L";
        }
    }

    var dummyMap = new gameMap( {
        "dimensions": {
            "width": 5,
            "height": 5
        },
        "world" : dummyMapRaw,
        "cities": []
    });
    describe("constructor method", function(){
        it("should add a single unit to a position", function(){
            //Given
            var player={units: [new unit("T", {y: 3, x:3})]};

            //When
            var map = new unitsMap([player], dummyMap).data;

            //Then
            expect(map[3][3]).toEqual(player.units[0]);
        });
        it("should add a two unit to different positions", function(){
            //Given
            var player={units: [new unit("T", {y: 3, x:3}),new unit("T", {y: 5, x:5})]};

            //When
            var map = new unitsMap([player], dummyMap).data;

            //Then
            expect(map[3][3]).toEqual(player.units[0]);
            expect(map[5][5]).toEqual(player.units[1]);
        });
        it("should not add a two unit to the same position", function(){
            //Given
            var player={units: [new unit("T", {y: 3, x:3}),new unit("F", {y: 3, x:3})]};

            //When
            try {
                var map = new unitsMap([player], dummyMap).data;
                expect(true).toEqual(false)
            } catch (error){
                //Then
                expect(error).toEqual("Cannot add units to the same position {\"y\":3,\"x\":3}")
            }
        });
        it("should units of all players", function(){
            //Given
            var player1={units: [new unit("T", {y: 3, x:3})]};
            var player2={units: [new unit("T", {y: 5, x:5})]};
                        
            //When
            var map = new unitsMap([player1, player2], dummyMap).data;

            //Then
            expect(map[3][3]).toEqual(player1.units[0]);
            expect(map[5][5]).toEqual(player2.units[0]);
        });
        it("should not add an unit to a city", function(){
            //Given
            var player={units: [new unit("t", {y: 3, x:3}),new city({y: 3, x:3})]};

            //When
            var map = new unitsMap([player], dummyMap).data;

            //Then
            expect(map[3][3]).toEqual(player.units[1]);
            expect(map[3][3].nestedUnits[0]).toEqual(player.units[0]);
        });
    });
    describe("addRange method", function(){
        it("should add a single unit to a position", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var map = new unitsMap(null, dummyMap);

            //When
            map.addRange(units);

            //Then
            expect(map.data[3][3]).toEqual(units[0]);
        });
        it("should add a two unit to different positions", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3}),new unit("T", {y: 5, x:5})];
            var map = new unitsMap(null, dummyMap);

            //When
            map.addRange(units);

            //Then
            expect(map.data[3][3]).toEqual(units[0]);
            expect(map.data[5][5]).toEqual(units[1]);
        });
        it("should not add a two unit to the same position", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3}),new unit("F", {y: 3, x:3})];
            var map = new unitsMap(null, dummyMap);

            //When
            try {
                map.addRange(units);
                expect(true).toEqual(false)
            } catch (error){
                //Then
                expect(error).toEqual("Cannot add units to the same position {\"y\":3,\"x\":3}")
            }
        });
        it("should not overwrite existing ranges", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3})]};
            var units = [new unit("T", {y: 5, x:5})];
            var map = new unitsMap([player], dummyMap);

            //When
            map.addRange(units);

            //Then
            expect(map.data[3][3]).toEqual(player.units[0]);
            expect(map.data[5][5]).toEqual(units[0]);
        });
    });
    describe("destroyed method", function(){
        it("should remove the destroyed unit", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3})]};
            var map = new unitsMap([player],dummyMap);
            expect(map.data[3][3]).toBeDefined()

            //When
            map.destroyed(player.units[0]);

            //Then
            expect(map.data[3][3]).toBeNull();
        });
        it("should remove the destroyed unit from the city", function(){
            //Given
            var cityInstance = new city("Tiel");
            var tank = new unit("T");
            tank.inside=cityInstance;
            var player = {units: [cityInstance]};
            var map = new unitsMap([player],dummyMap);
            spyOn(cityInstance, "destroyed");

            //When
            map.destroyed(tank);

            //Then
            expect(cityInstance.destroyed).toHaveBeenCalledWith(tank);
        });
    });
    describe("remove method", function(){
        it("should remove unit the unit at the position", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3})]};
            var map = new unitsMap([player],dummyMap);
            expect(map.data[3][3]).toBeDefined();

            //When
            map.remove({y: 3, x:3}, map.data[3][3]);

            //Then
            expect(map.data[3][3]).toBeNull();
        });

        it("should remove unit the unit at the position and return the removed unit", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3})]};
            var map = new unitsMap([player],dummyMap);
            expect(map.data[3][3]).toBeDefined();

            //When
            var result  = map.remove({y: 3, x:3});

            //Then
            expect(result).toEqual(player.units[0]);
        });
        it("should handle empty positions", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3})]};
            var map = new unitsMap([player]);

            //When
            map.remove({y: 4, x:4});
        });
    });
    describe("move method", function(){
        it("should move the unit", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            tank.movesLeft=1;
            var player = {units: [tank]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");

            //When
            var result  = map.move(player.units[0], {y: 4, x:4});
            
            //Then
            expect(map.collision).not.toHaveBeenCalled();
            expect(map.data[4][4]).toEqual(player.units[0]);
        });
        it("should move the unit in a circular world", function(){
            //Given
            var tank = new unit("T", {y: 0, x:0});
            tank.movesLeft=1;
            var player = {units: [tank]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");

            //When
            var result  = map.move(player.units[0], {y: 4, x:4});

            //Then
            expect(map.collision).not.toHaveBeenCalled();
            expect(map.data[4][4]).toEqual(player.units[0]);
        });
        it("should not move the unit over a distance greater than 1", function(){
            //Given
            var tank = new unit("T", {y: 3, x:3});
            tank.movesLeft=1;
            var player = {units: [tank]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");

            //When
            var result  = map.move(player.units[0], {y: 5, x:5});

            //Then
            expect(result).toBeFalsy();
            expect(map.collision).not.toHaveBeenCalled();
            expect(map.data[3][3]).toEqual(player.units[0]);
        });
        it("should not move the unit when unit can't move on specific land type", function(){
            //Given
            var unitInstance = new unit("T", {y: 3, x:3}).initTurn();
            var player = {units: [unitInstance]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");
            spyOn(unitInstance,"canMoveOn").and.returnValue(false);

            //When
            var result  = map.move(player.units[0], {y: 4, x:4});

            //Then
            expect(unitInstance.canMoveOn).toHaveBeenCalledWith('L');
            expect(map.data[3][3]).toEqual(player.units[0]);
        });
        it("should not move the unit when unit can't move any more", function(){
            //Given
            var unitInstance = new unit("T", {y: 3, x:3}).initTurn();
            var player = {units: [unitInstance]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");
            spyOn(unitInstance,"canMove").and.returnValue(false);

            //When
            var result  = map.move(player.units[0], {y: 4, x:4}, false);

            //Then
            expect(unitInstance.canMove).toHaveBeenCalledWith(false);
            expect(map.data[3][3]).toEqual(player.units[0]);
        });
        it("should detect a collision when colliding with a other unit", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}).initTurn(), new unit("T", {y: 4, x:4})]};
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");

            var result  = map.move(player.units[0], {y: 4, x:4});
            
            //Then
            expect(map.collision).toHaveBeenCalled();
            expect(map.data[3][3]).toEqual(player.units[0]);
            expect(map.data[4][4]).toEqual(player.units[1]);
        });
        it("should send enemies nearby on bus", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}).initTurn(), new unit("T", {y: 4, x:4})]};
            var unitInstance = player.units[0];
            unitInstance.initTurn();
            var map = new unitsMap([player], dummyMap);
            spyOn(map, "collision");
            spyOn(map, "enemyNearyBy").and.returnValue(["some", "units"]);
            spyOn(MessageBus, "send");

            var result  = map.move(unitInstance, {y: 2, x:2});

            expect(map.enemyNearyBy).toHaveBeenCalledWith(unitInstance, unitInstance.sight);
            expect(MessageBus.send).toHaveBeenCalledWith("enemy-spotted", ["some", "units"], unitInstance);
        });
    });
    describe("collision method", function(){
        it("should do nothing when unit is of same player and unit isn't a transporter", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}),{position: {y: 4, x:4}, type: "T"}]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");

            //When
            var result = map.collision({player: "a"}, {player: "a", canLoad: function(){return false}}, {x:1, y:1});

            //Then
            expect(MessageBus.send).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
        });
        it("should emit an load-unit event when units is a transporter", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}),new unit("T", {y: 4, x:4})]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");

            //When
            var transporter = {player: "a", canLoad: function(){return true;}};
            var subject = {player: "a", position: {y: 4, x:4}, embark: function(){}};
            var result = map.collision(subject, transporter, {x:1, y:1}, "from");

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-loaded", "from", subject);
        });
        it("should remove the unit from the map when not inside an other transport", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}),new unit("T", {y: 4, x:4})]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");
            spyOn(map, "remove");

            //When
            var transporter = {player: "a", canLoad: function(){return true;}};
            var subject = {player: "a", position: "position", embark: function(){}};
            var result = map.collision(subject, transporter, {x:1, y:1}, "from");

            //Then
            expect(map.remove).toHaveBeenCalledWith("position");
        });
        it("should disembark the unit when inside another unit", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}),new unit("T", {y: 4, x:4})]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");
            var old_transporter = {player: "a", canLoad: function(){return true;}, unload: function(){}};
            var new_transporter = {player: "a", canLoad: function(){return true;}};
            var subject = {player: "a", position: "position", embark: function(){}, inside: old_transporter};
            spyOn(old_transporter, "unload");

            //When
            var result = map.collision(subject, new_transporter, {x:1, y:1}, "from");

            //Then
            expect(old_transporter.unload).toHaveBeenCalledWith(subject);
            expect(result).toBeTruthy();
        });
        it("should embark the unit on the transporter", function(){
            //Given
            var player = {units: [new unit("T", {y: 3, x:3}),{position: {y: 4, x:4}, type: "T"}]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");

            //When
            var transporter = {player: "a", canLoad: function(){return true;}};
            var subject = {player: "a", position: {y: 4, x:4}, embark: function(){}};
            spyOn(subject, 'embark');
            var result = map.collision(subject, transporter, {x:1, y:1});

            //Then
            expect(subject.embark).toHaveBeenCalledWith(transporter, undefined);
            expect(result).toBeTruthy();
        });
        it("should emit an battle event when units collide of different players", function(){
            //Given
            var friend = new unit("T", {y: 3, x:3}).initTurn();
            friend.player="friend";
            var foe = new unit("T", {y: 4, x:4}).initTurn();
            foe.player="foe";

            var player = {units: [friend]};
            var map = new unitsMap([player], dummyMap);
            spyOn(MessageBus, "send");

            //When
            var result = map.collision(friend, foe, {x:1, y:1});

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("battle", friend, foe, {x:4, y:4},true);
            expect(result).toBeFalsy();
        });
        it("should emit an city-unser-siege event when unit collides with city of different players", function(){
            //Given
             var friend = new unit("T", {y: 3, x:3}).initTurn();
             friend.player="friend";
             var cityInstance = new city({y: 4, x:4}, "Demolish Polis").initTurn();
            cityInstance.player="foe";

             var player = {units: [friend]};
             var map = new unitsMap([player], dummyMap);
             spyOn(MessageBus, "send");

             //When
             var result = map.collision(friend, cityInstance, {x:1, y:1});
           

            //Then
            expect(result).toBeFalsy();
            expect(MessageBus.send).toHaveBeenCalledWith("city-under-siege", friend, cityInstance, {x:4, y:4});
        });
        it("should move the unit between cities", function(){
            //Given
            var city1 = new city( {y: 3, x:3}, "Tiel");
            var city2 = new city( {y: 4, x:4}, "Zoelen");
            var tank = new unit("T", {y: 3, x:3});
            tank.inside=city1;
            city1.nestedUnits=[tank];

            tank.movesLeft=1;
            var player = {units: [tank, city1, city2]};
            var map = new unitsMap([player], dummyMap);
            // spyOn(map, "collision");

            //When
            var result  = map.move(player.units[0], {y: 4, x:4});

            //Then
            // expect(map.collision).not.toHaveBeenCalled();
            expect(city1.nestedUnits.length).toEqual(0);
            expect(city2.nestedUnits.length).toEqual(1);
            expect(city2.nestedUnits[0]).toEqual(tank);
            expect(map.data[4][4]).toEqual(city2);
        });

        it("should move the unit out of the city and not remove from city from unit map", function(){
            //Given
            var city1 = new city( {y: 3, x:3}, "Tiel");
            var tank = new unit("T", {y: 3, x:3});
            tank.id=1;
            tank.inside=city1;
            city1.nestedUnits=[tank];

            tank.movesLeft=1;
            var player = {units: [tank, city1]};
            var map = new unitsMap([player], dummyMap);
            // spyOn(map, "collision");

            //When
            expect(map.unitAt(3,3)).toEqual(city1);

            var result  = map.move(player.units[0], {y: 4, x:4});

            //Then
            // expect(map.collision).not.toHaveBeenCalled();
            // expect(city1.nestedUnits.length).toEqual(0);
            // expect(city2.nestedUnits.length).toEqual(1);
            // expect(city2.nestedUnits[0]).toEqual(tank);
            expect(map.data[3][3]).toEqual(city1);
        });

        it("should move the unit between cities and not remove from city from unit map", function(){
            //Given
            var city1 = new city( {y: 3, x:3}, "Tiel");
            var city2 = new city( {y: 4, x:4}, "Zoelen");
            var tank = new unit("T", {y: 3, x:3});
            tank.id=1;
            tank.inside=city1;
            city1.nestedUnits=[tank];

            tank.movesLeft=1;
            var player = {units: [tank, city1, city2]};
            var map = new unitsMap([player], dummyMap);
            // spyOn(map, "collision");

            //When
            expect(map.unitAt(3,3)).toEqual(city1);

            var result  = map.move(player.units[0], {y: 4, x:4});

            //Then
            // expect(map.collision).not.toHaveBeenCalled();
            // expect(city1.nestedUnits.length).toEqual(0);
            // expect(city2.nestedUnits.length).toEqual(1);
            // expect(city2.nestedUnits[0]).toEqual(tank);
            expect(map.data[3][3]).toEqual(city1);
        });
    });
    describe("add method", function(){
        it("should add unit to a empty field", function(){
            //Given
            var player = {units: []};
            var map = new unitsMap([player], dummyMap);
            var unitInstance = {position: {x: 1, y: 1}, type: "T", health: 1};

            //When
            map.add(unitInstance);

            //Then
            expect(map.data[1][1]).toEqual(unitInstance);
        });
        it("should add unit a destroyed unit to a empty field", function(){
            //Given
            var player = {units: []};
            var map = new unitsMap([player], dummyMap);
            var unitInstance = {position: {x: 1, y: 1}, type: "T", health: 0};

            //When
            map.add(unitInstance);

            //Then
            expect(map.get({y: 1, x: 1})).toBeNull();
        });
        it("should add unit to an empty field (row)", function(){
            //Given
            var player = {units: [{position: {x: 2, y: 1}, type: "F", health: 1}]};
            var map = new unitsMap([player], dummyMap);
            var unitInstance = {position: {x: 1, y: 1}, type: "T", health: 1};

            //When
            map.add(unitInstance);

            //Then
            expect(map.data[1][1]).toEqual(unitInstance);
        });
        it("should not add unit to an position containing a unit", function(){
            //Given
            var player = {units: [new unit("F",{x: 1, y: 1}).initTurn()]};
            var map = new unitsMap([player], dummyMap);
            var unitInstance = new unit("T",{x: 1, y: 1}).initTurn();

            //When
            try {
                map.add(unitInstance);
                expect(true).toEqual(false)
            } catch (error){
                //Then
                expect(error).toEqual("Cannot add units to the same position {\"x\":1,\"y\":1}")
            }
        });
    });
    describe("get method", function(){
        it("should return the unit on the position", function(){
             //Given
            var unitInstance = new unit("T",{x: 1, y: 1});;
            var player = {units: [unitInstance]};
            var map = new unitsMap([player], dummyMap);

            //When
            var result = map.get({x: 1, y: 1});

            //Then
            expect(result).toEqual(unitInstance);
        });
        it("should handle empty positions (row)", function(){
             //Given
            var unitInstance = {position: {x: 1, y: 1}, type: "T"};
            var player = {units: [unitInstance]};
            var map = new unitsMap([player], dummyMap);

            //When
            var result = map.get({x: 2, y: 1});

            //Then
            expect(result).toEqual(null);
        });
        it("should handle empty positions", function(){
             //Given
            var unitInstance = {position: {x: 1, y: 1}, type: "T"};
            var player = {units: [unit]};
            var map = new unitsMap([player]);

            //When
            var result = map.get({x: 2, y: 2});

            //Then
            expect(result).toEqual(null);
        });
    });
    describe("addOrLoadRange method", function(){
        it("should add a single unit to a position", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3})];
            var map = new unitsMap(null, dummyMap);

            //When
            map.addOrLoadRange(units);

            //Then
            expect(map.data[3][3]).toEqual(units[0]);
        });
        it("should add a two unit to different positions", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3}),new unit("T", {y: 5, x:5})];
            var map = new unitsMap();

            //When
            map.addOrLoadRange(units);

            //Then
            expect(map.data[3][3]).toEqual(units[0]);
            expect(map.data[5][5]).toEqual(units[1]);
        });
        it("should not add a two unit to the same position", function(){
            //Given
            var units = [new unit("T", {y: 3, x:3}),new unit("F", {y: 3, x:3})];
            var map = new unitsMap();

            //When
            try {
                map.addOrLoadRange(units);
                expect(true).toEqual(false)
            } catch (error){
                //Then
                expect(error).toEqual("Cannot add units to the same position {\"y\":3,\"x\":3}")
            }
        });
        it("should load a unit on to an transport", function(){
            //Given
            var units = [new unit("t", {y: 3, x:3}),new unit("T", {y: 3, x:3}),new unit("I", {y: 3, x:3})];
            var map = new unitsMap();

            //When
            map.addOrLoadRange(units);

            //Then
            expect(map.data[3][3]).toEqual(units[0]);
            expect(map.data[3][3].nestedUnits[0]).toEqual(units[1]);
            expect(map.data[3][3].nestedUnits[1]).toEqual(units[2]);
        });
    });
    describe("enemyNearyBy method", function(){
        it("should return none when there is no other unit", function(){
            //Given
            var subject = new unit("T", {y: 3, x:3});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var map = new unitsMap([player], dummyMap);
            
            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([])

        });
        it("should return none when there is a friendly unit near by", function(){
            //Given
            var subject = new unit("T", {y: 3, x:3});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject,new unit("T", {y: 4, x:4})], dummyMap);
            var enemy=new humanPlayer(2, "2", "Computer", "red", [], dummyMap);
            var map = new unitsMap([player], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([]);

        });
        it("should return the unit when there is an enemy unit", function(){
            //Given
            var subject = new unit("T", {y: 3, x:3});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var foe = new unit("T", {y: 4, x:4});
            var enemy=new humanPlayer(2, "2", "Computer", "red", [foe], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([foe]);
        });
        it("should return none when the enemy unit is out of sight", function(){
            //Given
            var subject = new unit("T", {y: 0, x:0});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var enemy=new humanPlayer(2, "2", "Computer", "red", [new unit("T", {y: 4, x:4})], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([]);
        });
        it("should return none when the enemy unit is out of sight (border case)", function(){
            //Given
            var subject = new unit("T", {y: 0, x:0});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var enemy=new humanPlayer(2, "2", "Computer", "red", [new unit("T", {y: 3, x:3})], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([]);

        });
        it("should return true when the enemy unit is in sight (border case)", function(){
            //Given
            var subject = new unit("T", {y: 0, x:0});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var foe = new unit("T", {y: 2, x:2});
            var enemy=new humanPlayer(2, "2", "Computer", "red", [foe], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([foe]);
        });
        it("should return foe when the enemy unit is in sight", function(){
            //Given
            var subject = new unit("T", {y: 0, x:0});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var foe = new unit("T", {y: 0, x:3});
            var enemy=new humanPlayer(2, "2", "Computer", "red", [foe], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([foe])

        });
        it("should return foo and bar when both in sight", function(){
            //Given
            var subject = new unit("T", {y: 0, x:0});
            var player=new humanPlayer(1, "1", "1", "Player", "green", [subject], dummyMap);
            var foo = new unit("T", {y: 0, x:3});
            var bar = new unit("T", {y: 0, x:2});
            var enemy=new humanPlayer(2, "2", "Computer", "red", [foo, bar], dummyMap);
            var map = new unitsMap([player,enemy], dummyMap);

            //When
            var  result = map.enemyNearyBy(subject)

            //Then
            expect(result).toEqual([bar, foo])

        });
    });
});