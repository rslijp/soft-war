import {gameMap} from "../../game/game-map.js";
import {unit} from "../../game/unit.mjs";
import {navigationAStar} from "../../game/navigationAStar.mjs";

const makeMap = (world) => {
    const data = {
        "dimensions": {
            "height": world.length,
            "width": world[0].length,
        },
        "world" : world,
        "cities": []
    }
    // console.log(data)
    return new gameMap(data);
};

describe("Model.Navigation class", function(){
   var fogofwar = {discovered: function(){return true}}
    describe("route method of A-Star", function(){
        it("should return a linked route from 1,1 to 2,2", function(){
            //Given
            var unitInstance = new unit("I", {y: 1, x:1});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 2, x: 2});

            //Then
            expect(result.route).toEqual([{y: 2, x: 2, direction: "X"}])
        });
        it("should return a linked route from 1,1 to 3,3", function(){
            //Given
            var unitInstance = new unit("I", {y: 1, x:1});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toEqual([{ y : 2, x : 2, direction: "SE" }, { y : 3, x : 3, direction: "X" }])
        });
        it("should return a linked route from 1,1 to 3,1", function(){
            //Given
            var unitInstance = new unit("I", {y: 1, x:1});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 3, x: 1});

            //Then
            expect(result.route).toEqual([{ y : 2, x : 1, direction: "S" }, { y : 3, x : 1, direction: "X" }])
        });
        it("should return a linked route from 0,0 to 3,3", function(){
            //Given
            var unitInstance = new unit("I", {y: 0, x:0});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toEqual([{ y : 1, x : 1, direction: "SE" }, { y : 2, x : 2, direction: "SE" }, { y : 3, x : 3 , direction: "X"}]);
        });
        it("should return a linked route from 3,3 to 0,0", function(){
            //Given
            var unitInstance = new unit("I", {y: 3, x:3});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 0, x: 0});

            //Then
            expect(result.route).toEqual([ { y : 2, x : 2, direction: "NW" }, { y : 1, x : 1, direction: "NW" }, { y : 0, x : 0, direction: "X" }])
        });
          it("should not cross uncharted teritory", function(){
            //Given
            var testfog = {discovered: function(position){return position.y!=2}};
            var unitInstance = new unit("I", {y: 3, x:3});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "LLLL",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,testfog, true);

            //When
            var result = navigation.route({y: 0, x: 0});

            //Then
            expect(result.route).toBeUndefined();
        });
        it("should not return a linked route from 0,0 to 3,3 because unitInstance can't cross sea", function(){
            //Given
            var unitInstance = new unit("I", {y: 0, x:0});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "SSSS",
                            "LLLL",
                            "LLLL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toBeUndefined();
        });
        it("should return a linked route from avoiding the sea", function(){
            //Given
            var unitInstance = new unit("I", {y: 0, x:0});
            var mapInstance = makeMap(
                        [
                            "LLLL",
                            "SSSL",
                            "SSLS",
                            "LLSL"
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 3, x: 0});

            //Then
            expect(result.route).toEqual([{ y : 0, x : 1, direction: "E" }, { y : 0, x : 2, direction: "SE" }, { y : 1, x : 3, direction: "SW" }, { y : 2, x : 2, direction: "SW" }, { y : 3, x : 1, direction: "W" }, { y : 3, x : 0, direction: "X" }]);
        });
         it("should return a linked route from avoiding the mountain trap", function(){
            //Given
            var unitInstance = new unit("T", {y: 0, x:0});
            var mapInstance = makeMap(
                        [
                            "LLLLLLLLLLLL",
                            "LMMMMMMMMMML",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LMMMMMMMMMML",
                            "LLLLLLLLLLLL",
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 9, x: 9}, true);

            //Then
            expect(result.route).toBeDefined();
            expect(result.route.length).toEqual(19);
            expect(result.route[0]).toEqual({ y : 0, x : 1, direction: "E" });
            expect(result.route[18]).toEqual({ y : 9, x : 9, direction: "X" });

        });
        it("should return a linked route from using the mountain pass", function(){
            //Given
            var unitInstance = new unit("T", {y: 0, x:0});
            var mapInstance = makeMap(
                        [
                            "LLLLLLLLLLLL",
                            "LMMMMMMMMMML",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LMMMMMMLMMML",
                            "LLLLLLLLLLLL",
                        ]
            )
            var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);

            //When
            var result = navigation.route({y: 9, x: 9});

            //Then
            expect(result.route).toBeDefined();
            expect(result.route.length).toEqual(16);
            expect(result.route[0]).toEqual({ y : 1, x : 0, direction: "SE" });
            expect(result.route[15]).toEqual({ y : 9, x : 9, direction: "X" });

        });
        it("should be able to perform 35 routes in a 0.1 second", function(){
            //Given
            var unitInstance = new unit("I", {y: 0, x:0});
             var mapInstance = makeMap(
                        [
                            "LLLLLLLLLLLL",
                            "LMMMMMMMMMML",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LLLLLLLLMLLL",
                            "LMMMMMMMMMML",
                            "LLLLLLLLLLLL",
                        ]
            )

            //When
            var start = new Date();
            for(var i=0;i<35; i++){
                var navigation = new navigationAStar(mapInstance, unitInstance,fogofwar, true);
                var result = navigation.route({y: 14, x: 9});
                expect(result.route).toBeDefined();
            }
            var end = new Date();
            var runTime = end.getTime()-start.getTime();
            // if(window["console"]) window["console"].log(runTime+"msecs");
            expect(runTime).toBeLessThan(100);
        });
    });

});