import {fogOfWar} from "../../game/fog-of-war.mjs";
import {unit} from "../../game/unit.mjs";
import {testGameMap} from "../helpers/test-utils.mjs";

const map = testGameMap();

describe("fogOffWar class", function(){
    describe("add method", function(){
        it("should increase the units watching the surrounding square for the radius of the tank(3)", function(){
            //Given
            var fogofwar = new fogOfWar([], map);
            spyOn(fogofwar, "update");

            //When
            fogofwar.add(new unit("T", {x: 4, y:5}));
            
            //Then
            expect(fogofwar.update).toHaveBeenCalledWith({x: 4, y:5}, 3, 1);
        });
        it("should not update the fog of war when unit hasn't got a position", function(){
            //Given
            var fogofwar = new fogOfWar([], map);
            spyOn(fogofwar, "update");

            //When
            fogofwar.add(new unit("T", null));

            //Then
            expect(fogofwar.update).not.toHaveBeenCalled();
        });
        it("should not update the fog of war when unit has died", function(){
            //Given
            var fogofwar = new fogOfWar([], map);
            spyOn(fogofwar, "update");

            //When
            var tank = new unit("T", {x: 4, y:5});
            tank.health=0;
            fogofwar.add(tank);

            //Then
            expect(fogofwar.update).not.toHaveBeenCalled();
        });
    });
    describe("remove method", function(){
        it("should decrease the units watching the surrounding square for the radius of the tank(3)", function(){
            //Given
            var fogofwar = new fogOfWar([], map);
            spyOn(fogofwar, "update");

            //When
            fogofwar.remove(new unit("T", {x: 4, y:5}));

            //Then
            expect(fogofwar.update).toHaveBeenCalledWith({x: 4, y:5}, 3, -1);
        });
        it("should not update the fog of war when unit hasn't got a position", function(){
            //Given
            var fogofwar = new fogOfWar([], map);
            spyOn(fogofwar, "update");

            //When
            fogofwar.remove(new unit("T", null));

            //Then
            expect(fogofwar.update).not.toHaveBeenCalled();
        });
        it("should not update the fog of war when unit has died", function(){
                    //Given
            var fogofwar = new fogOfWar([]), map;
            spyOn(fogofwar, "update");

            //When
            var tank = new unit("T", {x: 4, y:5});
            tank.health=0;
            fogofwar.remove(tank);

            //Then
            expect(fogofwar.update).not.toHaveBeenCalledWith({x: 4, y:5}, 3, -1);
        });
    });
    describe("update method", function(){
        it("should add the value to the fields surround the position within the radius", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);

            //When
            fogofwar.update({x: 3, y:3}, 2, 4);

            //Then
            expect(data[0]).toBeUndefined();
            expect(data[1][2]).toBeUndefined();
            expect(data[1][3]).toEqual(4);
            expect(data[1][4]).toBeUndefined();
            expect(data[2][1]).toBeUndefined();
            expect(data[2][2]).toEqual(4);
            expect(data[2][3]).toEqual(4);
            expect(data[2][4]).toEqual(4);
            expect(data[2][5]).toBeUndefined();
            expect(data[3][0]).toBeUndefined();
            expect(data[3][1]).toEqual(4);
            expect(data[3][2]).toEqual(4);
            expect(data[3][3]).toEqual(4);
            expect(data[3][4]).toEqual(4);
            expect(data[3][5]).toEqual(4);
            expect(data[3][6]).toBeUndefined();
            expect(data[4][1]).toBeUndefined();
            expect(data[4][2]).toEqual(4);
            expect(data[4][3]).toEqual(4);
            expect(data[4][4]).toEqual(4);
            expect(data[4][5]).toBeUndefined();
            expect(data[5][2]).toBeUndefined();
            expect(data[5][3]).toEqual(4);
            expect(data[5][4]).toBeUndefined();
            expect(data[6]).toBeUndefined();
        });
        it("should update existing fields", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);
            fogofwar.update({x: 3, y:3}, 2, 4);

            //When
            fogofwar.update({x: 3, y:3}, 2, -1);

            //Then
            expect(data[1][3]).toEqual(3);
            expect(data[2][2]).toEqual(3);
            expect(data[2][3]).toEqual(3);
            expect(data[2][4]).toEqual(3);
            expect(data[3][1]).toEqual(3);
            expect(data[3][2]).toEqual(3);
            expect(data[3][3]).toEqual(3);
            expect(data[3][4]).toEqual(3);
            expect(data[3][5]).toEqual(3);
            expect(data[4][2]).toEqual(3);
            expect(data[4][3]).toEqual(3);
            expect(data[4][4]).toEqual(3);
            expect(data[5][3]).toEqual(3);
        });
        it("should increase discovered tiles", function(){
            //Given
           var fogofwar = new fogOfWar([], map);
           fogofwar.discoveredTiles=9;

           //When
           fogofwar.update({x: 3, y:3}, 2, 1);

           //Then
           expect(fogofwar.discoveredTiles).toEqual(22);
       });
               
    });
    describe("discovered method", function(){
        it("should report false for undiscovered area", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);

            //When
            var result = fogofwar.discovered({x: 3, y: 3});

            //Then
            expect(result).toBeFalsy();
        });
        it("should report false for discovered area", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);
            data[3]=[];
            data[3][3]=0;
            //When
            var result = fogofwar.discovered({x: 3, y: 3});

            //Then
            expect(result).toBeTruthy();
        });
    });
    describe("visible method", function(){
        it("should report false for undiscovered area", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);
            
            //When
            var result = fogofwar.visible({x: 3, y: 3});

            //Then
            expect(result).toBeFalsy();
        });
        it("should report false for discovered area", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);
            data[3]=[];
            data[3][3]=0;
            //When
            var result = fogofwar.visible({x: 3, y: 3});

            //Then
            expect(result).toBeFalsy();
        });
        it("should report true for discovered area which is in sight of a unit", function(){
            //Given
            var data = []
            var fogofwar = new fogOfWar(data, map);
            data[3]=[];
            data[3][3]=1;
            //When
            var result = fogofwar.visible({x: 3, y: 3});

            //Then
            expect(result).toBeTruthy();
        });
    });
});