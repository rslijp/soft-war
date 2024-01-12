import {gameMap} from "../../game/game-map.js";
import {CITY_NAMES} from "../../game/city.mjs";

describe("map class", function(){
    describe("init method", function(){
        it("should return the correct width", function(){
            //Given
            var world = [
                "LLSLL",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
            },
                "world" : world,
                "cities": []
            }

            //When
            var width = new gameMap(data).width;

            expect(width).toEqual(5);
        })
        it("should return the correct height", function(){
            //Given
            var world = [
                "LLSLL",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }


            //When
            var height = new gameMap(data).height;

            expect(height).toEqual(2);
        })
        it("should produce an error on an empty map", function(){
            var world = [];
            const data = {
                "dimensions": {
                    "height": 0,
                    "width": 0,
                },
                "world" : world,
                "cities": []
            }

            try {
                var map = new gameMap(data);
                expect("Expected exception").toBeUndefined();
            } catch (e){
                expect(e).toEqual("Empty map not allowed");
            }
        });
        it("should produce an error on null", function(){
            var data = null;

            try {
                var map = new gameMap(data);
                expect("Expected exception").toBeUndefined();
            } catch (e){
                expect(e).toEqual("Map data undefined");
            }
        });
        it("should produce an error on null", function(){
            var data = undefined;

            try {
                var map = new gameMap(data);
                expect("Expected exception").toBeUndefined();
            } catch (e){
                expect(e).toEqual("Map data undefined");
            }
        });
        it("should report inconsistent map dimensions", function(){
            var world = [
                "LLSLL",
                "LSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            try {
                var map = new gameMap(data);
                expect("Expected exception").toBeUndefined();
            } catch (e){
                expect(e).toEqual("Map has inconsistent width");
            }
        });
        it("should collect cities", function(){
            //Given
            var world = [
                "LLSML",
                "LLSLL"
            ];
            const cities = [{y:0, x: 0}, {y:1, x: 1}, {y:1, x: 3}];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": cities
            }

            //When
            var result = new gameMap(data).cities;

            expect(result.length).toEqual(3);
            expect(result[0].position).toEqual({y:0, x: 0});
            expect(result[1].position).toEqual({y:1, x: 1});
            expect(result[2].position).toEqual({y:1, x: 3});
        })
        it("should name cities", function(){
            //Given
            var world = [
                "LLSML",
                "LLSLL"
            ];
            const cities = [{y:0, x: 0}, {y:1, x: 1}, {y:1, x: 3}];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": cities
            }

            //When
            var result = new gameMap(data, [{y:0, x: 0}, {y:1, x: 1}, {y:3, x: 3}]).cities;

            expect(result.length).toEqual(3);
            expect(result[0].name).toEqual(CITY_NAMES[0]);
            expect(result[1].name).toEqual(CITY_NAMES[1]);
            expect(result[2].name).toEqual(CITY_NAMES[2]);
        })
    });
    describe("at method", function(){
        it("should return the land type at an existing location with an L", function(){
            //Given
            var world = [
                "LLSLL",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).at(0,0);

            //Then
            expect(result).toEqual("land");
        });
        it("should return the sea type at an existing location with an S", function(){
            //Given
            var world = [
                "LLSLL",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).at(0,2);

            //Then
            expect(result).toEqual("sea");
        });
        it("should return the mountain type at an existing location with an 'M'", function(){
            //Given
            var world = [
                "LLSLL",
                "LLSLM"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }
            //When
            var result = new gameMap(data).at(1,4);

            //Then
            expect(result).toEqual("mountain");
        });
    });
    describe("range method", function(){
        it("should return a range of 1,1-5,5 on position 3,3 with range 2", function(){
            //Given
            var world = [
                "LLSLLLL",
                "LLSLLLL",
                "LLSLLLL",
                "LLSLLLL",
                "LLSLLLL",
                "LLSLLLL",
                "LLSLLLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).range({x: 3, y: 3}, {x: 2, y: 2});

            //Then
            expect(result).toEqual({
                position: {x: 3, y: 3},
                from: {x: 1, y:1},
                to: {x: 5, y: 5}});
        });
        //should take the left boundry in to account and not produce a range outside the map
        it("should return a range of 0,2-4,6 on position 1,4 with range 2", function(){
            //Given
            var world = [
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL"
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).range({x: 1, y: 4}, {x: 2, y: 2});

            //Then
            expect(result).toEqual({
                position: {x: 1, y: 4},
                from: {x: 0, y:2},
                to: {x: 4, y: 6}});
        });
        //should take the right boundry in to account and not produce a range outside the map
        it("should return a range of 4,2-6,6 on position 5,4 with range 2", function(){
            //Given
            var world = [
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL"
                        ];

            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).range({x: 5, y: 4}, {x: 2, y: 2});

            //Then
            expect(result).toEqual({
                position: {x: 5, y: 4},
                from: {x: 2, y:2},
                to: {x: 6, y: 6}});
        });
        //should take the upper boundry in to account and not produce a range outside the map
        it("should return a range of 1,0-5,4 on position 5,1 with range 2", function(){
            //Given
            var world = [
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL"
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).range({x: 4, y: 1}, {x: 2, y: 2});

            //Then
            expect(result).toEqual(
                {position: {x: 4, y: 1},
                 from: {x: 2, y:0},
                 to: {x: 6, y: 4}}
            );
        });
        //should take the lower boundry in to account and not produce a range outside the map
        it("should return a range of 2,4-6,6 on position 4,5 with range 2", function(){
            //Given
            var world = [
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL",
                            "LLSLLLL"
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).range({x: 4, y: 5}, {x: 2, y: 2});

            //Then
            expect(result).toEqual({
                position: {x: 4, y: 5},
                from: {x: 2, y:2},
                to: {x: 6, y: 6}});
        });
    });
    describe("move method", function(){
        it("should return 1,0 on 1,1 on a move left", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("W", {y: 1, x: 1});

            //Then
            expect(result).toEqual({y: 1, x:0});
        });
        it("should return 1,2 on 1,1 on a move right", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("E", {y: 1, x: 1});

            //Then
            expect(result).toEqual({y: 1, x:2});
        });
        it("should return 0,1 on 1,1 on a move up", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("N", {y: 1, x: 1});

            //Then
            expect(result).toEqual({y: 0, x:1});
        });
        it("should return 0,1 on 1,1 on a move down", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("S", {y: 1, x: 1});

            //Then
            expect(result).toEqual({y: 2, x:1});
        });
        it("should return 1,2 on 1,0 on a move left and reappear on the right of the map", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("W", {y: 1, x: 0});

            //Then
            expect(result).toEqual({y: 1, x:2});
        });
        it("should return 1,0 on 1,2 on a move right and reappear at the left of the map", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("E", {y: 1, x: 2});

            //Then
            expect(result).toEqual({y: 1, x:0});
        });
        it("should return 2,1 on 0,1 on a move up and reappear on the bottom of the map", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("N", {y: 0, x: 1});

            //Then
            expect(result).toEqual({y: 2, x:1});
        });
        it("should return 0,1 on 2,1 on a move down and reappear at the top", function(){
             //Given
            var world = [
                            "LLS",
                            "LLS",
                            "LLS",
                        ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).move("S", {y: 2, x: 1});

            //Then
            expect(result).toEqual({y: 0, x:1});
        });
    });
    describe("cityAt method", function(){
        it("should return city at requested location", function(){
            //Given
            var world = [
                "LLSML",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": [{y:1, x: 3}]
            }

            //When
            var result = new gameMap(data).cityAt(1, 3);

            expect(result.clazz).toEqual("city");
            expect(result.position).toEqual({y:1, x: 3});
        });
        it("should return null at requested location with out a city", function(){
            //Given
            var world = [
                "LLSML",
                "LLSLL"
            ];
            const data = {
                "dimensions": {
                    "height": world.length,
                    "width": world[0].length,
                },
                "world" : world,
                "cities": []
            }

            //When
            var result = new gameMap(data).cityAt(2,2);

            expect(result).toBeNull();
        });
    });
    describe("position method", function(){
        it("should forward to at method", function(){

            //Given
          var world = [
              "LLSML",
              "LLSLL"
          ];
          const data = {
            "dimensions": {
                "height": world.length,
                "width": world[0].length,
            },
            "world" : world,
            "cities": []
          }

          var map = new gameMap(data);
          spyOn(map, "at");
          //When
          map.position({y: 45, x: 22});
          //Then
          expect(map.at).toHaveBeenCalledWith(45, 22);
        });
    });
})