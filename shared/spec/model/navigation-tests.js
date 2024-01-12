describe("Model.Navigation class", function(){
    it("should be an alias for Model.NavigationForwardAndBackward", function(){
        //Given
        expect(Model.Navigation).toEqual(Model.NavigationAStar)
    });
    var fogofwar = {discovered: function(){return true}}
    describe("route method of A*", function(){
        it("should return a linked route from 1,1 to 2,2", function(){
            //Given
            var unit = new Model.Unit("I", {y: 1, x:1});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 2, x: 2});

            //Then
            expect(result.route).toEqual([{y: 2, x: 2, direction: "X"}])
        });
        it("should return a linked route from 1,1 to 3,3", function(){
            //Given
            var unit = new Model.Unit("I", {y: 1, x:1});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toEqual([{ y : 2, x : 2, direction: "SE" }, { y : 3, x : 3, direction: "X" }])
        });
        it("should return a linked route from 1,1 to 3,1", function(){
            //Given
            var unit = new Model.Unit("I", {y: 1, x:1});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 3, x: 1});

            //Then
            expect(result.route).toEqual([{ y : 2, x : 1, direction: "S" }, { y : 3, x : 1, direction: "X" }])
        });
        it("should return a linked route from 0,0 to 3,3", function(){
            //Given
            var unit = new Model.Unit("I", {y: 0, x:0});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toEqual([{ y : 1, x : 1, direction: "SE" }, { y : 2, x : 2, direction: "SE" }, { y : 3, x : 3 , direction: "X"}]);
        });
        it("should return a linked route from 3,3 to 0,0", function(){
            //Given
            var unit = new Model.Unit("I", {y: 3, x:3});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 0, x: 0});

            //Then
            expect(result.route).toEqual([ { y : 2, x : 2, direction: "NW" }, { y : 1, x : 1, direction: "NW" }, { y : 0, x : 0, direction: "X" }])
        });
          it("should not cross uncharted teritory", function(){
            //Given
            var testfog = {discovered: function(position){return position.y!=2}};
            var unit = new Model.Unit("I", {y: 3, x:3});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,testfog);

            //When
            var result = navigation.route({y: 0, x: 0});

            //Then
            expect(result.route).toBeUndefined();
        });
        it("should not return a linked route from 0,0 to 3,3 because unit can't cross sea", function(){
            //Given
            var unit = new Model.Unit("I", {y: 0, x:0});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "S"},{"type": "S"},{"type": "S"},{"type": "S"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 3, x: 3});

            //Then
            expect(result.route).toBeUndefined();
        });
        it("should return a linked route from avoiding the sea", function(){
            //Given
            var unit = new Model.Unit("I", {y: 0, x:0});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "S"},{"type": "S"},{"type": "S"},{"type": "L"}],
                            [{"type": "S"},{"type": "S"},{"type": "L"},{"type": "S"}],
                            [{"type": "L"},{"type": "L"},{"type": "S"},{"type": "L"}]
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 3, x: 0});

            //Then
            expect(result.route).toEqual([{ y : 0, x : 1, direction: "E" }, { y : 0, x : 2, direction: "SE" }, { y : 1, x : 3, direction: "SW" }, { y : 2, x : 2, direction: "SW" }, { y : 3, x : 1, direction: "W" }, { y : 3, x : 0, direction: "X" }]);
        });
         it("should return a linked route from avoiding the mountain trap", function(){
            //Given
            var unit = new Model.Unit("T", {y: 0, x:0});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

            //When
            var result = navigation.route({y: 9, x: 9});

            //Then
            expect(result.route).toBeDefined();
            expect(result.route.length).toEqual(19);
            expect(result.route[0]).toEqual({ y : 0, x : 1, direction: "E" });
            expect(result.route[18]).toEqual({ y : 9, x : 9, direction: "X" });

        });
        it("should return a linked route from using the mountain pass", function(){
            //Given
            var unit = new Model.Unit("T", {y: 0, x:0});
            var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                        ]
            )
            var navigation = new Model.NavigationAStar(map, unit,fogofwar);

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
            var unit = new Model.Unit("I", {y: 0, x:0});
             var map = new Model.Map(
                        [
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "M"},{"type": "L"},{"type": "L"},{"type": "L"}],
                            [{"type": "L"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "M"},{"type": "L"}],
                            [{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"},{"type": "L"}],
                        ]
            )

            //When
            var start = new Date();
            _(35).times(function(){
                var navigation = new Model.NavigationAStar(map, unit,fogofwar);
                var result = navigation.route({y: 14, x: 9});
                expect(result.route).toBeDefined();
            });
            var end = new Date();
            var runTime = end.getTime()-start.getTime();
            if(window["console"]) window["console"].log(runTime+"msecs");
            expect(runTime).toBeLessThan(100);
        });
    });

});