import {unit} from "../../game/unit.mjs";
import {default as MessageBus} from "../../services/message-service.mjs";
import {unitTypes} from "../../game/unit-types.mjs";

describe("unit class", function(){
    describe("constructor", function(){
        it("should initialize the health to the type health", function(){
            //Given
            var unitInstance =  new unit("b", {x: 4, y:8});

            //When
            var result = unitInstance.health;

            expect(result).toEqual(unitTypes["b"].health);
        });
    });
    describe("definition method", function(){
        it("should fecth the definition form the unitInstance types", function(){
            //Given
            var unitInstance =  new unit("b", {x: 4, y:8});

            //When
            var result = unitInstance.definition();

            expect(result).toEqual(unitTypes["b"]);
        });
    });
    describe("canMoveOn method", function(){
        it("should allow movement on land for a Infantry", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});

            //When
            var result = unitInstance.canMoveOn({type:"L"});

            expect(result).toEqual(true);
        });
        it("should allow movement on sea for a Infantry", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});

            //When
            var result = unitInstance.canMoveOn("S");

            expect(result).toEqual(false);
        });
    });
    describe("canMove method", function(){
        it("should allow movement when movement points are still left", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=1;
            //When
            var result = unitInstance.canMove();

            expect(result).toBeTruthy();
        });
        it("should not allow movement when movement points are exhausted", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=0;
            //When
            var result = unitInstance.canMove();

            expect(result).toBeFalsy()
        });
        it("should allow movement when movement points are exhausted, but when a blits is performed", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=0;
            unitInstance.blitzed=false;
            //When
            var result = unitInstance.canMove(true);

            expect(result).toBeTruthy()
        });
         it("should only allow blitz once", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=0;
            unitInstance.blitzed=true;
            //When
            var result = unitInstance.canMove(true);

            expect(result).toBeFalsy()
        });
        it("should not allow movement when health points are exhausted", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=1;
            unitInstance.health=0;
            //When
            var result = unitInstance.canMove();

            expect(result).toBeFalsy()
        });
    });
    describe("move method", function(){
        it("should move the unitInstance to a new position", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=1;

            //When
            unitInstance.move({x:5, y:8});

            expect(unitInstance.position).toEqual({x:5, y:8});
        });
        it("should reduce movement points when moving", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=1;

            //When
            unitInstance.move({x:5, y:8});

            expect(unitInstance.movesLeft).toEqual(0);
        });
        it("should not reduce movement points when blitzing", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=1;

            //When
            unitInstance.move({x:5, y:8}, true);

            expect(unitInstance.movesLeft).toEqual(1);
        });
        it("should reduce fuel points when moving", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8}).initTurn();
            unitInstance.fuel=1;

            //When
            unitInstance.move({x:5, y:8}, false);

            expect(unitInstance.fuel).toEqual(0);
        });
        it("should crash plane when out of fuel", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8}).initTurn();
            unitInstance
            unitInstance.fuel=1;
            spyOn(MessageBus,"send");

            //When
            unitInstance.move({x:5, y:8});

            expect(MessageBus.send).toHaveBeenCalledWith("unit-out-of-fuel", unitInstance)
        });
        it("should not crash plane when blitz is performed", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8}).initTurn();
            unitInstance.fuel=1;
            spyOn(MessageBus,"send");

            //When
            unitInstance.move({x:5, y:8}, true);

            expect(MessageBus.send).not.toHaveBeenCalledWith("unit-out-of-fuel", unitInstance)
        });
        it("should not crash plane when fuel isn't exhaused", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8}).initTurn();
            unitInstance.fuel=2;
            spyOn(MessageBus,"send");

            //When
            unitInstance.move({x:5, y:8});

            expect(MessageBus.send).not.toHaveBeenCalledWith("unit-out-of-fuel", unitInstance)
        });
        it("should not allow movement when movement points are exhausted", function(){
            //Given
            var unitInstance =  new unit("I", {x: 4, y:8});
            unitInstance.movesLeft=0;

            //When
            try{
                unitInstance.move({x:5, y:8});
                expect(true).toBeFalsy();
            } catch (error){
                expect(error).toEqual("Unit can't move in this turn")
            }
        });

    });
    describe("initTurn method", function(){
        it("should initialize the movesLeft", function(){
            var unitInstance =  new unit("F", {x: 4, y:8});
            unitInstance.movesLeft=0;

            unitInstance.initTurn();

            expect(unitInstance.movesLeft).toEqual(8)
        });
        it("should initialize the movesLeft of nested unitInstances", function(){
            var transport =  new unit("t", {x: 4, y:8});
            var load =  new unit("F");
            transport.internalLoad(load);
            load.movesLeft=0;

            transport.initTurn();

            expect(load.movesLeft).toEqual(8)
        });
    });
    describe("canLoad method", function(){
        it("should not allow loading of unitInstances when unitInstance can not load units", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            expect(unitInstance.definition().canLoadUnits).toBeUndefined();

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
         });
        it("should  allow loading of unitInstances when unitInstance can load the specific unitInstances", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            expect(unitInstance.definition().canLoadUnits).toEqual(["I", "T", "M"]);

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeTruthy();
        });
        it("should not allow loading of unitInstances when nestedUnits unitInstance is out of moves", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;
            expect(unitInstance.definition().canLoadUnits).toEqual(["I", "T", "M"]);

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should allow loading of unitInstances when the fact that the nested unitInstance is out of moves ia ignored", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            tank.movesLeft=0;
            expect(unitInstance.definition().canLoadUnits).toEqual(["I", "T", "M"]);

            //When
            var result = unitInstance.canLoad(tank, true);

            //Then
            expect(result).toBeTruthy();
        });
        it("should not allow loading of unitInstances when unitInstance can't load the specific unitInstances", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var fighter =  new unit("F", {x: 4, y:8}).initTurn();
            expect(unitInstance.definition().canLoadUnits).toEqual(["I", "T", "M"]);

            //When
            var result = unitInstance.canLoad(fighter);

            //Then
            expect(result).toBeFalsy();
         });
        it("should  allow loading of unitInstances when there is enough capacity", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.nestedUnits=[1,2,3,4,5];
            expect(unitInstance.definition().capacity).toEqual(6);

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeTruthy();
        });
        it("should not allow loading of unitInstances are owned by different players", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.player="a";
            tank.player="b";
            unitInstance.nestedUnits=[1,2,3,4,5];
            expect(unitInstance.definition().capacity).toEqual(6);

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
        });
        it("should not allow loading of unitInstances when the maximum capacity is reached", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.nestedUnits=[1,2,3,4,5,6];
            expect(unitInstance.definition().capacity).toEqual(6);

            //When
            var result = unitInstance.canLoad(tank);

            //Then
            expect(result).toBeFalsy();
         });
    });
    describe("loadUnit method", function(){
        it("should not allow loading of unitInstances when unitInstance can not load units", function(){
            //Given
            var unitInstance =  new unit("F", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            expect(unitInstance.canLoad(tank)).toBeFalsy();

            //When
            try {
                unitInstance.load(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't load unit");
            }
         });
        it("should load a unitInstance when possible", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();

            //When
            unitInstance.load(tank);

            //Then
            expect(unitInstance.nestedUnits).toEqual([tank]);
        });
        it("should add unitInstance to load", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.nestedUnits=[infantry];
            //When
            unitInstance.load(tank);

            //Then
            expect(unitInstance.nestedUnits).toEqual([infantry,tank]);
        });
        it("should clear the position of the nestedUnits unitInstance", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.nestedUnits=[infantry];
            //When
            unitInstance.load(tank);

            //Then
            expect(tank.position).toBeNull();
        });
        it("should link tank and transport", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.nestedUnits=[infantry];
            //When
            unitInstance.load(tank);

            //Then
            expect(tank.inside).toEqual(unitInstance);
        });
        it("loading a fighter in a unitInstance should fuel the unitInstance", function(){
            //Given
            var unitInstance =  new unit("A", {x: 4, y:8});
            var fighter =  new unit("F", {x: 4, y:8}).initTurn();
            fighter.fuel=2;
            //When
            unitInstance.load(fighter);

            //Then
            expect(fighter.fuel).toEqual(fighter.definition().fuel);
        });
    });
    describe("loadUnit method", function(){
            it("should not allow unloading of when unitInstance wasn't nestedUnits", function(){
                //Given
                var unitInstance =  new unit("F", {x: 4, y:8});
                var tank =  new unit("T", {x: 4, y:8}).initTurn();
                unitInstance.nestedUnits=[];
                
                //When
                try {
                    unitInstance.unload(tank);
                    expect(true).toEqual(false);
                } catch (e){
                    //Then
                    expect(e).toEqual("Can't unload unit");
                }
             });
            it("should unload a unitInstance when possible", function(){
                //Given
                var unitInstance =  new unit("t", {x: 4, y:8});
                var tank =  new unit("T", {x: 4, y:8}).initTurn();
                unitInstance.nestedUnits = [tank];
                //When
                unitInstance.unload(tank);

                //Then
                expect(unitInstance.nestedUnits).toEqual([]);
            });
        it("should only unload the unitInstance", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8}).initTurn();
            var tank =  new unit("T", {x: 4, y:8});
            unitInstance.nestedUnits=[infantry,tank];
            //When
            unitInstance.unload(infantry);

            //Then
            expect(unitInstance.nestedUnits).toEqual([tank]);
        });
        it("should not unload the unitInstance when the unitInstance can be unnestedUnits", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var infantry =  new unit("I", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8});
            tank.movesLeft=0;
            unitInstance.nestedUnits=[infantry,tank];
            //When
            unitInstance.unload(infantry);

            //Then
            expect(unitInstance.nestedUnits).toEqual([infantry,tank]);
        });
        it("should unlink the tank and the transport", function(){
            //Given
            var unitInstance =  new unit("t", {x: 4, y:8});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.load(tank);
            //When
            unitInstance.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("derivedPosition method", function(){
        it("should return own position when not on transport", function(){
            //Given
            var tank =  new unit("T", {x: 4, y:8}).initTurn();

            //When
            var position = tank.derivedPosition();

            //Then
            expect(position).toEqual({x: 4, y:8});
        });
        it("should return position of transport when on transport", function(){
            //Given
            var unitInstance =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.load(tank);
            //When
            var position = tank.derivedPosition();

            //Then
            expect(position.x).toEqual(5);
            expect(position.y).toEqual(6);
        });
        it("should return add 'nestedUnits' remark on position", function(){
            //Given
            var unitInstance =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            unitInstance.load(tank);
            //When
            var position = tank.derivedPosition();

            //Then
            expect(position.remark).toEqual("loaded");
        });
    });
    describe("unload method", function(){
        it("should throw an exception when unitInstance isn't nestedUnits ", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
                         
            //When
            try {
                transport.unload(tank);
                expect(true).toEqual(false);
            } catch (e){
                //Then
                expect(e).toEqual("Can't unload unit")
            }
        });
        it("should not unload unit if unitInstance can't move anymore", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);
            tank.movesLeft=0;
            //When
            transport.unload(tank);

            //Then
            expect(tank.inside).toEqual(transport);
        });
        it("should filter out tank from nestedUnits items", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.nestedUnits=["a", tank, "c"];
            
            //When
            transport.unload(tank);

            //Then
            expect(transport.nestedUnits).toEqual(["a", "c"]);
        });
        it("should unlink tank and transport on unload", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);

            //When
            transport.unload(tank);

            //Then
            expect(tank.inside).toBeNull();
        });
    });
    describe("embark method", function(){
        it("should call load unit on transport", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            spyOn(transport, 'load');
            
            //When
            tank.embark(transport);

            //Then
            expect(transport.load).toHaveBeenCalledWith(tank, undefined);
        });
        it("should be null safe", function(){
            //Given
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            
            //When
            tank.embark(null);
        });
    });
    describe("disembark method", function(){
        it("should call unload unit on transport", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);
            spyOn(transport, 'unload');
            spyOn(tank, 'move');

            //When
            tank.disembark();

            //Then
            expect(transport.unload).toHaveBeenCalledWith(tank);
        });
        it("should be null safe", function(){
            //Given
            var tank =  new unit("T", {x: 4, y:8}).initTurn();

            //When
            tank.disembark();
        });
        it("should call set position unitInstance of transport", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);
            spyOn(transport, 'unload');
            spyOn(tank, 'move');

            //When
            tank.disembark();

            //Then
            expect(tank.position).toEqual(transport.position);
        });
        it("should call set position unitInstance of transport", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);
            spyOn(transport, 'unload');
            spyOn(tank, 'move');

            //When
            tank.disembark("to");

            //Then
            expect(tank.move).toHaveBeenCalledWith("to")
        });
    });
    describe("isOn method", function(){
        it("should return true if unitInstance is on that position", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
          
            //When
            var result = transport.isOn({x: 5, y:6});

            //Then
            expect(result).toBeTruthy();
        });
        it("should return false if unitInstance is not on that position(x)", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});

            //When
            var result = transport.isOn({x: 6, y:6});

            //Then
            expect(result).toBeFalsy();
        });
        it("should return false if unitInstance is not on that position(y)", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});

            //When
            var result = transport.isOn({x: 5, y:5});

            //Then
            expect(result).toBeFalsy();
        });
        it("should return true if unitInstance is on transport position", function(){
            //Given
            var transport =  new unit("t", {x: 5, y:6});
            var tank =  new unit("T", {x: 4, y:8}).initTurn();
            transport.load(tank);
                        

            //When
            var result = tank.isOn({x: 5, y:6});

            //Then
            expect(result).toBeTruthy();
        });
    });
    describe("attack method", function(){
        it("should emit an battle event when unitInstances collide of different players", function(){
            //Given
            var friend = new unit("T", {y: 3, x:3}).initTurn();
            friend.player="friend";
            var foe = new unit("T", {y: 4, x:4}).initTurn();
            foe.player="foe";
             spyOn(MessageBus, "send");

            //When
            var result = friend.attack(foe);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("battle", friend, foe, {x:4, y:4},true);
        });
        it("should emit an city-unser-siege event when unitInstance collides with city of different players", function(){
            //Given
            var friend = new unit("T", {y: 3, x:3}).initTurn();
            friend.player="friend";
            var foe = new unit("T", {y: 4, x:4}).initTurn();
            foe.player="foe";
             spyOn(MessageBus, "send");

            //When
            var result = friend.attack(foe);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("battle", friend, foe, {x:4, y:4},true);
        });
        it("should detect move for attack", function(){
            //Given
            var friend = new unit("T", {y: 3, x:3}).initTurn();
            friend.player="friend";
            friend.movesLeft=1;
            var foe = new unit("T", {y: 4, x:4}).initTurn();
            foe.player="foe";
             spyOn(MessageBus, "send");

            //When
            var result = friend.attack(foe);

            //Then
            expect(friend.movesLeft).toEqual(0);
        });
        it("should not allow battle and throw exception when out out of moves", function(){
            //Given
            var friend = new unit("T", {y: 3, x:3}).initTurn();
            friend.player="friend";
            friend.movesLeft=0;
            var foe = new unit("T", {y: 4, x:4}).initTurn();
            foe.player="foe";
             spyOn(MessageBus, "send");

            //When
            try {
                var result = friend.attack(foe);
                expect(true).toBeFalsy();
            } catch (e){
                expect(e).toEqual("Unit can't attack in this turn")
            }
        });
    });
});