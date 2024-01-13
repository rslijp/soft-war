import {city} from "../../game/city.mjs";
import {unit} from "../../game/unit.mjs";
import {MessageBus} from "../../index.js";
import {unitTypes} from "../../game/unit-types.mjs";

describe("city class", function(){
    describe("should canMove", function(){
        it("should be false. We don't support trailerparks", function(){
            var cityInstance =  new city({x: 4, y:8}).initTurn();
            var result = cityInstance.canMove();
            expect(result).toBeFalsy();
        });
    });
    describe("canLoad method", function(){
        it("should not allow loading of units when loaded unit is out of move", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;
            
            //When
            var result = cityInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should allow loading of units when the fact that the nested unit is out of moves ia ignored", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;

            //When
            var result = cityInstance.canLoad(tank, true);

            //Then
            expect(result).toBeTruthy();
        });
        it("should  allow loading of units when there is enough capacity", function(){
            //Given2
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=[1,2,3,4,5,6,7];
   
            //When
            var result = cityInstance.canLoad(tank);

            //Then
            expect(result).toBeTruthy();
        });
        it("should not allow loading of units are owned by different players", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.player={name: "a", nextId: ()=>Math.random()};
            tank.player={name: "b", nextId: ()=>Math.random()};

            //When
            var result = cityInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should not allow loading of units when the maximum capacity is reached", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=[1,2,3,4,5,6,7,8];
            
            //When
            var result = cityInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
         });
    });
    describe("loadUnit method", function(){
        it("should not allow loading of citys when city can not load citys", function(){
            //Given
            var cityInstance =  new city("F", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=[1,2,3,4,5,6,7,8]
            expect(cityInstance.canLoad(tank)).toBeFalsy();

            //When
            try {
                cityInstance.load(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't load unit");
            }
         });
        it("should load a city when possible", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();

            //When
            cityInstance.load(tank);

            //Then
            expect(cityInstance.nestedUnits).toEqual([tank]);
        });
        it("should add unit to nestedUnits", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var infantry =  new city("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=[infantry];
            //When
            cityInstance.load(tank);

            //Then
            expect(cityInstance.nestedUnits).toEqual([infantry,tank]);
        });
        it("should clear the position of the loaded city", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var infantry =  new city("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.loaded=[infantry];
            //When
            cityInstance.load(tank);

            //Then
            expect(tank.position).toBeNull();
        });
        it("should link tank and transport", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var infantry =  new city("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.loaded=[infantry];
            //When
            cityInstance.load(tank);

            //Then
            expect(tank.inside).toEqual(cityInstance);
        });
    });
    describe("loadUnit method", function(){
        it("should not allow unloading of when unit wasn't loaded", function(){
            //Given
            var cityInstance =  new city("F", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=[];

            //When
            try {
                cityInstance.unload(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't unload unit");
            }
         });
        it("should unload a unit when possible", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits = [tank];
            //When
            cityInstance.unload(tank);

            //Then
            expect(cityInstance.nestedUnits).toEqual([]);
        });
        it("should only unload the city", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8}).initTurn();
            var tank =  new unit("T", {x: 4, y:8});
            cityInstance.nestedUnits=[infantry,tank];
            //When
            cityInstance.unload(infantry);

            //Then
            expect(cityInstance.nestedUnits).toEqual([tank]);
        });
        it("should not unload the city when the city can be unloaded", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8});
            tank.movesLeft=0;
            cityInstance.nestedUnits=[infantry,tank];
            //When
            cityInstance.unload(infantry);

            //Then
            expect(cityInstance.nestedUnits).toEqual([infantry,tank]);
        });
        it("should unlink the tank and the city", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.load(tank);
            //When
            cityInstance.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("derivedPosition method", function(){
        it("should return own position", function(){
            //Given
            var cityInstance =  new city({x: 4, y:8}).initTurn();

            //When
            var position = cityInstance.derivedPosition();

            //Then
            expect(position).toEqual({x: 4, y:8});
        });
    });
    describe("unload method", function(){
        it("should throw an exception when unit isn't loaded ", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
                         
            //When
            try {
                cityInstance.unload(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't unload unit")
            }
        });
        it("should not unload city if unit can't move anymore", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.load(tank);
            tank.movesLeft=0;
            //When
            cityInstance.unload(tank);

            //Then
            expect(tank.inside).toEqual(cityInstance);
        });
        it("should filter out tank from loaded items", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.nestedUnits=["a", tank, "c"];
            
            //When
            cityInstance.unload(tank);

            //Then
            expect(cityInstance.nestedUnits).toEqual(["a", "c"]);
        });
        it("should unlink tank a city on unload", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            cityInstance.load(tank);

            //When
            cityInstance.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("producing method", function(){
        it("should return unit being produced", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";

            //When
            var result = cityInstance.producing();

            //Then
            expect(result).toEqual(unitTypes['T']);
            expect(result.name).toEqual("Tank");
        });
        it("should return nothing when not producing", function(){
            //Given
            var cityInstance =  new city( {x: 5, y:6});
            cityInstance.producingType=null;

            //When
            var result = cityInstance.producing();

            //Then
            expect(result).toBeNull();
        });
    });
    describe("endTurn method", function(){
        it("should increase production progress when producing an unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=0;
            
            //When
            cityInstance.endTurn();

            //Then
            expect(cityInstance.production).toEqual(1);

        });
        it("should reset production progress when not producing any unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType=null;
            cityInstance.production=2;

            //When
            cityInstance.endTurn();

            //Then
            expect(cityInstance.production).toEqual(0);

        });
        it("should complete production and produce the unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs-1;
            cityInstance.nestedUnits=[];
            spyOn(cityInstance, "constructUnit");
            //When
            cityInstance.endTurn();

            //Then
            expect(cityInstance.constructUnit).toHaveBeenCalled();
        });
        it("should send a city-not-producing event when the city isn't producing", function(){
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType=null;
            spyOn(MessageBus, "send");
            //When
            cityInstance.endTurn();

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("city-not-producing", cityInstance);
        });
    });
    describe("produce method", function(){
        it("should set producingType", function(){
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType=null;

            //When
            cityInstance.produce("T");

            //Then
            expect(cityInstance.producingType).toEqual("T")
        });
        it("should reset production progress", function(){
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType=null;
            cityInstance.production=2;

            //When
            cityInstance.produce("T");

            //Then
            expect(cityInstance.production).toEqual(0)
        });
        it("should not reset production progress when same unit is selected", function(){
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=2;

            //When
            cityInstance.produce("T");

            //Then
            expect(cityInstance.production).toEqual(2)
        });
    });
    describe("constructUnit method", function(){
         it("should complete production and produce the unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[];
            cityInstance.player={name: "PLAYER", nextId: ()=>Math.random()};

             //When
            cityInstance.constructUnit();

            //Then
            expect(cityInstance.nestedUnits.length).toEqual(1);
            expect(cityInstance.nestedUnits[0].type).toEqual("T");
        });
        it("should set the player on the new unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[];
            cityInstance.player={name: "PLAYER", nextId: ()=>Math.random()};

             //When
            cityInstance.constructUnit();

            //Then
            expect(cityInstance.nestedUnits[0].player.name).toEqual("PLAYER");
        });
        it("should clear production progress", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[];
            cityInstance.player={name: "PLAYER", nextId: ()=>Math.random()};

             //When
            cityInstance.constructUnit();

            //Then
            expect(cityInstance.production).toEqual(0);
        });
        it("should throw an error when costs are not build yet", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs-1;
            cityInstance.nestedUnits=[];
            cityInstance.player={name: "PLAYER", nextId: ()=>Math.random()};

             //When
            try {
                cityInstance.constructUnit();
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Unit isn't finished yet");
            }
        });
        it("should suspend creation of unit when city is full", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[1,2,3,4,5,6,7,8];

             //When
            cityInstance.constructUnit();

            //Then
            expect(cityInstance.nestedUnits.length).toEqual(8);
        });
        it("should send a flash message to warn the player when production is suspended", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[1,2,3,4,5,6,7,8];
            spyOn(MessageBus, "send");

             //When
            cityInstance.constructUnit();

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-creation-suspended", cityInstance, unitTypes['T'])
        });
        it("should send a flash message to inform the player of an new unit", function(){
            //Given
            var cityInstance =  new city({x: 5, y:6});
            cityInstance.producingType="T";
            cityInstance.production=cityInstance.producing().costs;
            cityInstance.nestedUnits=[];
            cityInstance.player={name: "PLAYER", nextId: ()=>Math.random()};
            spyOn(MessageBus, "send");

             //When
            cityInstance.constructUnit();

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-created", cityInstance, cityInstance.nestedUnits[0])
        });
    });
    describe("initTurn method", function(){
        it("should initialize the movesLeft of nested units", function(){
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            var load =  new unit("F");
            cityInstance.internalLoad(load);
            load.movesLeft=0;

            cityInstance.initTurn();

            expect(load.movesLeft).toEqual(8)
        });
    });
    describe("destroy method", function(){
        it("should initialize the movesLeft of nested units", function(){
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            var load =  new unit("F");
            cityInstance.nestedUnits=[load];
            spyOn(cityInstance, "destroyed").and.callThrough();

            cityInstance.destroyed(load);

            expect(cityInstance.nestedUnits).toEqual([])
        });
    });
    describe("siege method", function(){
        it("should return a city defense hash", function(){
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            var result = cityInstance.siege();
            expect(result.health).toEqual(1);
            expect(result.city).toEqual(cityInstance);
            expect(result.clazz).toEqual("city-defense");
            expect(result.derivedPosition()).toEqual({x: 4, y:8});
            expect(result.modifiers()).toEqual([]);
        });
    });
    describe("conquered method", function(){
        it("should reset production", function(){
            spyOn(MessageBus, "send");
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            cityInstance.player=0;
            cityInstance.production=2;
            cityInstance.producingType="*";
            
            cityInstance.conquered(1);

            expect(cityInstance.production).toEqual(0);
            expect(cityInstance.producingType).toBeNull();
        });
        it("should set player", function(){
            spyOn(MessageBus, "send");
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            cityInstance.player=0;
            
            cityInstance.conquered(1);

            expect(cityInstance.player).toEqual(1);
        });
        it("should publish a city conquered event", function(){
            spyOn(MessageBus, "send");
            var cityInstance =  new city({x: 4, y:8}, "Tiel");
            cityInstance.player=0;

            cityInstance.conquered(1);

            expect(MessageBus.send).toHaveBeenCalledWith("city-conquered", cityInstance);
        });
    });
});