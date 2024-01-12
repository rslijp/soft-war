describe("Model.City class", function(){
    describe("should canMove", function(){
        it("should be false. We don't support trailerparks", function(){
            var city =  new Model.City({x: 4, y:8}).initTurn();
            var result = city.canMove();
            expect(result).toBeFalsy();
        });
    });
    describe("canLoad method", function(){
        it("should not allow loading of units when loaded unit is out of move", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;
            
            //When
            var result = city.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should allow loading of units when the fact that the nested unit is out of moves ia ignored", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;

            //When
            var result = city.canLoad(tank, true);

            //Then
            expect(result).toBeTruthy();
        });
        it("should  allow loading of units when there is enough capacity", function(){
            //Given2
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=[1,2,3,4,5,6,7];
   
            //When
            var result = city.canLoad(tank);

            //Then
            expect(result).toBeTruthy();
        });
        it("should not allow loading of units are owned by different players", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.player="a";
            tank.player="b";

            //When
            var result = city.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should not allow loading of units when the maximum capacity is reached", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=[1,2,3,4,5,6,7,8];
            
            //When
            var result = city.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
         });
    });
    describe("loadUnit method", function(){
        it("should not allow loading of citys when city can not load citys", function(){
            //Given
            var city =  new Model.City("F", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=[1,2,3,4,5,6,7,8]
            expect(city.canLoad(tank)).toBeFalsy();

            //When
            try {
                city.load(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't load unit");
            }
         });
        it("should load a city when possible", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();

            //When
            city.load(tank);

            //Then
            expect(city.nestedUnits).toEqual([tank]);
        });
        it("should add unit to nestedUnits", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var infantry =  new Model.City("I", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=[infantry];
            //When
            city.load(tank);

            //Then
            expect(city.nestedUnits).toEqual([infantry,tank]);
        });
        it("should clear the position of the loaded city", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var infantry =  new Model.City("I", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.loaded=[infantry];
            //When
            city.load(tank);

            //Then
            expect(tank.position).toBeNull();
        });
        it("should link tank and transport", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var infantry =  new Model.City("I", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.loaded=[infantry];
            //When
            city.load(tank);

            //Then
            expect(tank.inside).toEqual(city);
        });
    });
    describe("loadUnit method", function(){
        it("should not allow unloading of when unit wasn't loaded", function(){
            //Given
            var city =  new Model.City("F", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=[];

            //When
            try {
                city.unload(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't unload unit");
            }
         });
        it("should unload a unit when possible", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits = [tank];
            //When
            city.unload(tank);

            //Then
            expect(city.nestedUnits).toEqual([]);
        });
        it("should only unload the city", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var infantry =  new Model.Unit("I", {x: 4, y:8}).initTurn();
            var tank =  new Model.Unit("T", {x: 4, y:8});
            city.nestedUnits=[infantry,tank];
            //When
            city.unload(infantry);

            //Then
            expect(city.nestedUnits).toEqual([tank]);
        });
        it("should not unload the city when the city can be unloaded", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var infantry =  new Model.Unit("I", {x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8});
            tank.movesLeft=0;
            city.nestedUnits=[infantry,tank];
            //When
            city.unload(infantry);

            //Then
            expect(city.nestedUnits).toEqual([infantry,tank]);
        });
        it("should unlink the tank and the city", function(){
            //Given
            var city =  new Model.City({x: 4, y:8});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.load(tank);
            //When
            city.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("derivedPosition method", function(){
        it("should return own position", function(){
            //Given
            var city =  new Model.City({x: 4, y:8}).initTurn();

            //When
            var position = city.derivedPosition();

            //Then
            expect(position).toEqual({x: 4, y:8});
        });
    });
    describe("unload method", function(){
        it("should throw an exception when unit isn't loaded ", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
                         
            //When
            try {
                city.unload(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't unload unit")
            }
        });
        it("should not unload city if unit can't move anymore", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.load(tank);
            tank.movesLeft=0;
            //When
            city.unload(tank);

            //Then
            expect(tank.inside).toEqual(city);
        });
        it("should filter out tank from loaded items", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.nestedUnits=["a", tank, "c"];
            
            //When
            city.unload(tank);

            //Then
            expect(city.nestedUnits).toEqual(["a", "c"]);
        });
        it("should unlink tank a city on unload", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            var tank =  new Model.Unit("T", {x: 4, y:8}).initTurn();
            city.load(tank);

            //When
            city.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("producing method", function(){
        it("should return unit being produced", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";

            //When
            var result = city.producing();

            //Then
            expect(result).toEqual(Model.UnitTypes['T']);
            expect(result.name).toEqual("Tank");
        });
        it("should return nothing when not producing", function(){
            //Given
            var city =  new Model.City( {x: 5, y:6});
            city.producingType=null;

            //When
            var result = city.producing();

            //Then
            expect(result).toBeNull();
        });
    });
    describe("endTurn method", function(){
        it("should increase production progress when producing an unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=0;
            
            //When
            city.endTurn();

            //Then
            expect(city.production).toEqual(1);

        });
        it("should reset production progress when not producing any unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType=null;
            city.production=2;

            //When
            city.endTurn();

            //Then
            expect(city.production).toEqual(0);

        });
        it("should complete production and produce the unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs-1;
            city.nestedUnits=[];
            spyOn(city, "constructUnit");
            //When
            city.endTurn();

            //Then
            expect(city.constructUnit).toHaveBeenCalled();
        });
        it("should send a city-not-producing event when the city isn't producing", function(){
            var city =  new Model.City({x: 5, y:6});
            city.producingType=null;
            spyOn(Service.Bus, "send");
            //When
            city.endTurn();

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("city-not-producing", city);
        });
    });
    describe("produce method", function(){
        it("should set producingType", function(){
            var city =  new Model.City({x: 5, y:6});
            city.producingType=null;

            //When
            city.produce("T");

            //Then
            expect(city.producingType).toEqual("T")
        });
        it("should reset production progress", function(){
            var city =  new Model.City({x: 5, y:6});
            city.producingType=null;
            city.production=2;

            //When
            city.produce("T");

            //Then
            expect(city.production).toEqual(0)
        });
        it("should not reset production progress when same unit is selected", function(){
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=2;

            //When
            city.produce("T");

            //Then
            expect(city.production).toEqual(2)
        });
    });
    describe("constructUnit method", function(){
         it("should complete production and produce the unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[];

             //When
            city.constructUnit();

            //Then
            expect(city.nestedUnits.length).toEqual(1);
            expect(city.nestedUnits[0].type).toEqual("T");
        });
        it("should set the player on the new unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[];
            city.player="PLAYER"

             //When
            city.constructUnit();

            //Then
            expect(city.nestedUnits[0].player).toEqual("PLAYER");
        });
        it("should clear production progress", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[];

             //When
            city.constructUnit();

            //Then
            expect(city.production).toEqual(0);
        });
        it("should throw an error when costs are not build yet", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs-1;
            city.nestedUnits=[];

             //When
            try {
                city.constructUnit();
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Unit isn't finished yet");
            }
        });
        it("should suspend creation of unit when city is full", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[1,2,3,4,5,6,7,8];

             //When
            city.constructUnit();

            //Then
            expect(city.nestedUnits.length).toEqual(8);
        });
        it("should send a flash message to warn the player when production is suspended", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[1,2,3,4,5,6,7,8];
            spyOn(Service.Bus, "send");

             //When
            city.constructUnit();

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-creation-suspended", city, Model.UnitTypes['T'])
        });
        it("should send a flash message to inform the player of an new unit", function(){
            //Given
            var city =  new Model.City({x: 5, y:6});
            city.producingType="T";
            city.production=city.producing().costs;
            city.nestedUnits=[];
            spyOn(Service.Bus, "send");

             //When
            city.constructUnit();

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-created", city, city.nestedUnits[0])
        });
    });
    describe("initTurn method", function(){
        it("should initialize the movesLeft of nested units", function(){
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            var load =  new Model.Unit("F");
            city.internalLoad(load);
            load.movesLeft=0;

            city.initTurn();

            expect(load.movesLeft).toEqual(8)
        });
    });
    describe("destroy method", function(){
        it("should initialize the movesLeft of nested units", function(){
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            var load =  new Model.Unit("F");
            city.nestedUnits=[load];
            spyOn(city, "destroyed").andCallThrough();

            city.destroyed(load);

            expect(city.nestedUnits).toEqual([])
        });
    });
    describe("siege method", function(){
        it("should return a city defense hash", function(){
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            var result = city.siege();
            expect(result.health).toEqual(1);
            expect(result.city).toEqual(city);
            expect(result.clazz).toEqual("city-defense");
            expect(result.derivedPosition()).toEqual({x: 4, y:8});
            expect(result.modifiers()).toEqual([]);
        });
    });
    describe("conquered method", function(){
        it("should reset production", function(){
            spyOn(Service.Bus, "send");
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            city.player=0;
            city.production=2;
            city.producingType="*";
            
            city.conquered(1);

            expect(city.production).toEqual(0);
            expect(city.producingType).toBeNull();
        });
        it("should set player", function(){
            spyOn(Service.Bus, "send");
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            city.player=0;
            
            city.conquered(1);

            expect(city.player).toEqual(1);
        });
        it("should publish a city conquered event", function(){
            spyOn(Service.Bus, "send");
            var city =  new Model.City({x: 4, y:8}, "Tiel");
            city.player=0;

            city.conquered(1);

            expect(Service.Bus.send).toHaveBeenCalledWith("city-conquered", city);
        });
    });
});