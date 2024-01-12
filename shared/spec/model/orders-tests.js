describe("Model.Orders class", function(){
    var player = new Model.Player(0, "Sirius", "black", [])
    describe("executeOrders method", function(){
        afterEach(function(){
            Service.Bus.unlock();
        })
        it("should execute the order there is an order and the unit can move", function(){
            //given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var unitsmap = {enemyNearyBy: function(){return false;}}
            infantry.order="the order";
            spyOn(infantry, "canMove").andReturn(true);
            var orders = new Model.Orders(infantry, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){infantry.order=null})
            spyOn(orders, "newEnemies").andReturn(false);

            //when
            orders.executeOrders();

            //then
            expect(orders.executeAction).toHaveBeenCalledWith("the order");
        });
        it("should execute nextOrder", function(){
            //given
            var fighter = new Model.Unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var orders = new Model.Orders(fighter, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(orders, "nextOrder");
            spyOn(orders, "newEnemies").andReturn(false);

            //when
            orders.executeOrders();

            //then
            expect(orders.nextOrder).toHaveBeenCalledWith()
        });
        it("should not execute nextOrder when execution of current order fails", function(){
            //given
            var fighter = new Model.Unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var orders = new Model.Orders(fighter, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){fighter.movesLeft-=1; return false;})
            spyOn(orders, "nextOrder");
            spyOn(orders, "newEnemies").andReturn(false);

            //when
            orders.executeOrders();

            //then
            expect(orders.nextOrder).not.toHaveBeenCalledWith()
        });
        it("should lock the bus", function(){
            //given
            var fighter = new Model.Unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var orders = new Model.Orders(fighter, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(orders, "nextOrder");
            spyOn(orders, "newEnemies").andReturn(false);
            spyOn(Service.Bus, "lock");
            spyOn(Service.Bus, "unlock");
            
            //when
            orders.executeOrders();

            //then
            expect(Service.Bus.lock).toHaveBeenCalledWith()
            expect(Service.Bus.unlock).not.toHaveBeenCalledWith()
        });
        it("should unlock the bus when done", function(){
            //given
            var fighter = new Model.Unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            var orders = new Model.Orders(fighter, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(orders, "nextOrder");
            spyOn(Service.Bus, "lock");
            spyOn(Service.Bus, "unlock");

            //when
            orders.executeOrders();

            //then
            expect(Service.Bus.lock).toHaveBeenCalledWith()
            expect(Service.Bus.unlock).toHaveBeenCalledWith()
        });
        it("should request next unit of player", function(){
            //given
            var fighter = new Model.Unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            var orders = new Model.Orders(fighter, unitsmap,player);
            spyOn(orders, "executeAction").andCallFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(orders, "nextOrder");
            spyOn(player, "jumpToNextUnit");
            spyOn(Service.Bus, "lock");
            spyOn(Service.Bus, "unlock");

            //when
            orders.executeOrders();

            //then
            expect(player.jumpToNextUnit).toHaveBeenCalledWith(fighter)
        });
        it("should not execute the order when an enemy is insight", function(){
            //given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var unitsmap = {enemyNearyBy: function(){return [new Model.Unit("I", {y: 1, x:2})];}}
            infantry.order="the order";
            spyOn(infantry, "canMove").andReturn(true);
            spyOn(Service.Bus, "send");
            var orders = new Model.Orders(infantry, unitsmap,player);
            spyOn(orders, "executeAction");
            spyOn(orders, "newEnemies").andReturn(true);

            //when
            orders.executeOrders();

            //then
            expect(orders.executeAction).not.toHaveBeenCalled();
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-order-attention", infantry, "the order");
        });
        it("should not execute the order the unit is no order and the unit can move", function(){
            //given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order=null;
            spyOn(infantry, "canMove").andReturn(true);
            var orders = new Model.Orders(infantry, "unitsmap",player);
            spyOn(orders, "executeAction")
            spyOn(orders, "newEnemies").andReturn(false);

            //when
            orders.executeOrders();

            //then
            expect(orders.executeAction).not.toHaveBeenCalled()
        });
        it("should not execute the order the unit is has an order but it can't move", function(){
            //given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order="the order";
            spyOn(infantry, "canMove").andReturn(false);
            var orders = new Model.Orders(infantry, "unitsmap",player);
            spyOn(orders, "executeAction")
            spyOn(orders, "newEnemies").andReturn(false);

            //when
            orders.executeOrders();

            //then
            expect(orders.executeAction).not.toHaveBeenCalled()


        });
    });
    describe("executeAction method", function(){
        it("should execute the specific order", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){};
            spyOn(orders, "executeSpecific").andReturn(true);
            spyOn(Service.Bus, "send");

            //When
            orders.executeAction(order);

            //Then
            expect(orders.executeSpecific).toHaveBeenCalledWith(order);

        });
        it("should send and event that the order is executed", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){};
            spyOn(orders, "executeSpecific").andReturn(true);
            spyOn(Service.Bus, "send");

            //When
            orders.executeAction(order);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-order-step", infantry, order);

        });
        it("should send and event that the order is executed", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){};
            spyOn(orders, "executeSpecific").andReturn(true);
            spyOn(Service.Bus, "send");
            spyOn(player.fogOfWar, "remove");
            spyOn(player.fogOfWar, "add");

            //When
            orders.executeAction(order);

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalledWith(infantry);
            expect(player.fogOfWar.add).toHaveBeenCalledWith(infantry);

        });

        it("should request attention when the order execution failed", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order = order;
            var orders = new Model.Orders(infantry, "unitsmap",player);
            orders.executeSpecific = function(){};
            spyOn(orders, "executeSpecific").andReturn(null);
            spyOn(Service.Bus, "send");

            //When
            orders.executeAction(order);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-order-attention", infantry, order);
        });
        it("should execute the specific order", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Specific"};
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){return "command"};
            spyOn(unitsmap, "move").andReturn(true);

            //When
            orders.executeAction(infantry.order);

            //Then
            expect(unitsmap.move).toHaveBeenCalledWith(infantry, "command");

        });
        it("should request attention when the actual moving fails", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order =order;
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){return "command"};
            spyOn(unitsmap, "move").andReturn(false);
            spyOn(Service.Bus, "send");

            //When
            orders.executeAction(order);

            //Then
            expect(Service.Bus.send).toHaveBeenCalledWith("unit-order-attention", infantry, order);
        });
        it("should restore original order", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order = order;
            var unitsmap={move: function(){return true;}};
            var orders = new Model.Orders(infantry, unitsmap,player);
            orders.executeSpecific = function(){};
            spyOn(orders, "executeSpecific").andCallFake(function(){order.action="Changed"; return "step";});
            spyOn(unitsmap, "move").andReturn(false);
            
            spyOn(Service.Bus, "send");

            //When
            expect(order.action).toEqual("Specific")
            expect(infantry.order.action).toEqual("Specific")
                               
            orders.executeAction(order);
            
            //Then
            expect(order.action).toEqual("Changed")
            expect(infantry.order.action).toEqual("Specific")
        });

    });
    describe("executeMove method", function(){
        it("should return the next move step", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executeMove(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x: 2});
        });
        it("should pop step from the move queue", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executeMove(infantry.order);

            //Then
            expect(infantry.order.queue).toEqual([{y: 3, x: 3}]);
        });
        it("should clear the order when no more moves need to be done", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 3, x:3}]};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executeMove(infantry.order);

            //Then
            expect(infantry.order).toBeNull();
            
        });
    });
    describe("executePatrol method", function(){
        it("should return the next move step", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x: 2});
        });
        it("should initialize the index on 1", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(1);
        });
        it("should increase index in the queue", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(2);
        });
        it("should return the next item on the path", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 3, x:3});
        });
        it("should move back the index when at the end", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 2};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(1);
        });
        it("should reverse the order when done", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 2};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 4, x:4});
            expect(infantry.order.reverse).toBeTruthy();

        });
        it("should keep moving back when in reverse", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1, reverse: true};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 3, x:3});
            expect(infantry.order.index).toEqual(0);
            expect(infantry.order.reverse).toBeTruthy();

        });
        it("should reverse the order when back at the start", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 0, reverse: true};
            var orders = new Model.Orders(infantry);

            //When
            var result = orders.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x:2});
            expect(infantry.order.index).toEqual(1);
            expect(infantry.order.reverse).toBeFalsy();

        });
        it("should loop nicely", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4},{y: 5, x:5}]};
            var orders = new Model.Orders(infantry);

            //When
            expect(orders.executePatrol(infantry.order)).toEqual({y: 2, x:2});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 5, x:5});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 2, x:2});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 5, x:5});
            expect(orders.executePatrol(infantry.order)).toEqual({y: 4, x:4});
        });
    });
    describe("executeRoam method", function(){
        it("should not change direction in 90% of the time", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").andReturn(1-0.9);
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");
            
            //When
            var result = orders.executeRoam(infantry.order);

            //Then
            expect(orders.goDirection).toHaveBeenCalledWith("S")
        });
        it("should change direction in 10% of the time", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").andReturn(0.9);
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");

            //When
            var result = orders.executeRoam(infantry.order);

            //Then
            expect(orders.goDirection).toHaveBeenCalledWith("SE")
        });
        it("should return the updated position", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").andReturn(0.9);
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");

            //When
            var result = orders.executeRoam(infantry.order);

            //Then
            expect(result).toEqual("updated position")
        });
        it("should initialize a direction when non present", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam"};
            spyOn(Math, "random").andReturn(0.4);
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");

            //When
            var result = orders.executeRoam(infantry.order);

            //Then
            expect(infantry.order.direction).toEqual("S")
        });
    });
    describe("executeDirection method", function(){
        it("should go in the directoin of the order", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Direction", direction: "direction"};
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");

            //When
            var result = orders.executeDirection(infantry.order);

            //Then
            expect(orders.goDirection).toHaveBeenCalledWith("direction")
        });
        it("should return the updated position", function(){
            //Given
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order ={action: "Direction", direction: "S"};
            var orders = new Model.Orders(infantry);
            spyOn(orders, "goDirection").andReturn("updated position");

            //When
            var result = orders.executeDirection(infantry.order);

            //Then
            expect(result).toEqual("updated position")
        });
    });
    describe("goDirection method", function(){
        //    this.goDirection=function(direction){
        //        var current = unit.derivedPosition();
        //        var to = unitsmap.map.goDirection(direction, current);
        //        return (to.y==current.y && to.x==current.x)?null:step;
        //    }
        it("should ask map for new coordinates", function(){
            //Given
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            var orders = new Model.Orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").andReturn({y: 4, x: 2});
            
            //When
            orders.goDirection("W");

            //Then
            expect(unitsmap.map.move).toHaveBeenCalledWith("W", {y: 3, x: 2});
        });
        it("should return new coordinates", function(){
            //Given
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            var orders = new Model.Orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").andReturn({y: 4, x: 2});

            //When
            var result = orders.goDirection("W");

            //Then
            expect(result).toEqual({y: 4, x: 2});
        });
         it("should return null when unit hasn't moved (map border)", function(){
            //Given
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            var orders = new Model.Orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").andReturn({y: 3, x: 2});

            //When
            var result = orders.goDirection("W");

            //Then
            expect(result).toBeNull();
        });
    });
    describe("newEnemies method", function(){
        it("should lazy initialize foes on order", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order={};
            var orders = new Model.Orders(infantry, unitsmap);

            orders.newEnemies(["foo", "bar"])

            expect(infantry.order.foes).toEqual(["foo", "bar"]);
        });
        it("should return true on first encountering of enemies", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order={};
            var orders = new Model.Orders(infantry, unitsmap);

            var result = orders.newEnemies(["foo", "bar"])

            expect(result).toBeTruthy();
        });
        it("should return false on reencountering of same enemies", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order={foes: ["foo", "bar"]};
            var orders = new Model.Orders(infantry, unitsmap);

            var result = orders.newEnemies(["foo", "bar"])

            expect(result).toBeFalsy();
        });
        it("should return true on  new encountering of enemy", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new Model.Unit("I", {y: 3, x:2});
            infantry.order={foes: ["foo", "bar"]};
            var orders = new Model.Orders(infantry, unitsmap);

            var result = orders.newEnemies(["foe", "bar"])

            expect(result).toBeTruthy();
        });
    });
});