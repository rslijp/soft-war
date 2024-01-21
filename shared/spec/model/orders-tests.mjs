import {unit} from "../../game/unit.mjs";
import {orders} from "../../game/orders.mjs";
import {MessageBus} from "../../index.js";
import {humanPlayer} from "../../game/human-player.js";

describe("orders class", function(){
    var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
    var player = new humanPlayer(0, "0","Sirius", "black", [], unitsmap);
    describe("executeOrders method", function(){
        afterEach(function(){
            MessageBus.unlock();
        })
        it("should execute the order there is an order and the unit can move", function(){
            //given
            var infantry = new unit("I", {y: 1, x:1});
            var unitsmap = {enemyNearyBy: function(){return false;}}
            infantry.order="the order";
            spyOn(infantry, "canMove").and.returnValue(true);
            var ordersInstance = new orders(infantry, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){infantry.order=null})
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.executeAction).toHaveBeenCalledWith("the order");
        });
        it("should execute nextOrder", function(){
            //given
            var fighter = new unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var ordersInstance = new orders(fighter, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(ordersInstance, "nextOrder");
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.nextOrder).toHaveBeenCalledWith()
        });
        it("should not execute nextOrder when execution of current order fails", function(){
            //given
            var fighter = new unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var ordersInstance = new orders(fighter, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){fighter.movesLeft-=1; return false;})
            spyOn(ordersInstance, "nextOrder");
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.nextOrder).not.toHaveBeenCalledWith()
        });
        it("should lock the bus", function(){
            //given
            var fighter = new unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            fighter.order="the order";
            var ordersInstance = new orders(fighter, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(ordersInstance, "nextOrder");
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);
            spyOn(MessageBus, "lock");
            spyOn(MessageBus, "unlock");
            
            //when
            ordersInstance.executeOrders();

            //then
            expect(MessageBus.lock).toHaveBeenCalledWith()
            expect(MessageBus.unlock).not.toHaveBeenCalledWith()
        });
        it("should unlock the bus when done", function(){
            //given
            var fighter = new unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            var ordersInstance = new orders(fighter, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(ordersInstance, "nextOrder");
            spyOn(MessageBus, "lock");
            spyOn(MessageBus, "unlock");

            //when
            ordersInstance.executeOrders();

            //then
            expect(MessageBus.lock).toHaveBeenCalledWith()
            expect(MessageBus.unlock).toHaveBeenCalledWith()
        });
        it("should request next unit of player", function(){
            //given
            var fighter = new unit("F", {y: 1, x:1}).initTurn();
            var unitsmap = {enemyNearyBy: function(){return false;}}
            var ordersInstance = new orders(fighter, unitsmap,player);
            spyOn(ordersInstance, "executeAction").and.callFake(function(){fighter.movesLeft-=1; return true;})
            spyOn(ordersInstance, "nextOrder");
            spyOn(player, "jumpToNextUnit");
            spyOn(MessageBus, "lock");
            spyOn(MessageBus, "unlock");

            //when
            ordersInstance.executeOrders();

            //then
            expect(player.jumpToNextUnit).toHaveBeenCalledWith(fighter)
        });
        it("should not execute the order when an enemy is insight", function(){
            //given
            var infantry = new unit("I", {y: 1, x:1});
            var unitsmap = {enemyNearyBy: function(){return [new unit("I", {y: 1, x:2})];}}
            infantry.order="the order";
            spyOn(infantry, "canMove").and.returnValue(true);
            spyOn(MessageBus, "send");
            var ordersInstance = new orders(infantry, unitsmap,player);
            spyOn(ordersInstance, "executeAction");
            spyOn(ordersInstance, "newEnemies").and.returnValue(true);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.executeAction).not.toHaveBeenCalled();
            expect(MessageBus.send).toHaveBeenCalledWith("unit-order-attention", infantry, "the order");
        });
        it("should not execute the order the unit is no order and the unit can move", function(){
            //given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order=null;
            spyOn(infantry, "canMove").and.returnValue(true);
            var ordersInstance = new orders(infantry, "unitsmap",player);
            spyOn(ordersInstance, "executeAction")
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.executeAction).not.toHaveBeenCalled()
        });
        it("should not execute the order the unit is has an order but it can't move", function(){
            //given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order="the order";
            spyOn(infantry, "canMove").and.returnValue(false);
            var ordersInstance = new orders(infantry, "unitsmap",player);
            spyOn(ordersInstance, "executeAction")
            spyOn(ordersInstance, "newEnemies").and.returnValue(false);

            //when
            ordersInstance.executeOrders();

            //then
            expect(ordersInstance.executeAction).not.toHaveBeenCalled()


        });
    });
    describe("executeAction method", function(){
        it("should execute the specific order", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){};
            spyOn(ordersInstance, "executeSpecific").and.returnValue(true);
            spyOn(MessageBus, "send");

            //When
            ordersInstance.executeAction(order);

            //Then
            expect(ordersInstance.executeSpecific).toHaveBeenCalledWith(order);

        });
        it("should send and event that the order is executed", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){};
            spyOn(ordersInstance, "executeSpecific").and.returnValue(true);
            spyOn(MessageBus, "send");

            //When
            ordersInstance.executeAction(order);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-order-step", infantry, order);

        });
        it("should send and event that the order is executed", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order ={action: "Specific"};
            var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){};
            spyOn(ordersInstance, "executeSpecific").and.returnValue(true);
            spyOn(MessageBus, "send");
            spyOn(player.fogOfWar, "remove");
            spyOn(player.fogOfWar, "add");

            //When
            ordersInstance.executeAction(order);

            //Then
            expect(player.fogOfWar.remove).toHaveBeenCalledWith(infantry);
            expect(player.fogOfWar.add).toHaveBeenCalledWith(infantry);

        });

        it("should request attention when the order execution failed", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order = order;
            var ordersInstance = new orders(infantry, "unitsmap",player);
            ordersInstance.executeSpecific = function(){};
            spyOn(ordersInstance, "executeSpecific").and.returnValue(null);
            spyOn(MessageBus, "send");

            //When
            ordersInstance.executeAction(order);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-order-attention", infantry, order);
        });
        it("should execute the specific order", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Specific"};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){return "command"};
            spyOn(unitsmap, "move").and.returnValue(true);

            //When
            ordersInstance.executeAction(infantry.order);

            //Then
            expect(unitsmap.move).toHaveBeenCalledWith(infantry, "command");

        });
        it("should request attention when the actual moving fails", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order =order;
            var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){return "command"};
            spyOn(unitsmap, "move").and.returnValue(false);
            spyOn(MessageBus, "send");

            //When
            ordersInstance.executeAction(order);

            //Then
            expect(MessageBus.send).toHaveBeenCalledWith("unit-order-attention", infantry, order);
        });
        it("should restore original order", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            var order = {action: "Specific"};
            infantry.order = order;
            var unitsmap={move: function(){return true;}, normalize: (pos)=>pos};
            var ordersInstance = new orders(infantry, unitsmap,player);
            ordersInstance.executeSpecific = function(){};
            spyOn(ordersInstance, "executeSpecific").and.callFake(function(){order.action="Changed"; return "step";});
            spyOn(unitsmap, "move").and.returnValue(false);
            
            spyOn(MessageBus, "send");

            //When
            expect(order.action).toEqual("Specific")
            expect(infantry.order.action).toEqual("Specific")
                               
            ordersInstance.executeAction(order);
            
            //Then
            expect(order.action).toEqual("Changed")
            expect(infantry.order.action).toEqual("Specific")
        });

    });
    describe("executeMove method", function(){
        it("should return the next move step", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executeMove(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x: 2});
        });
        it("should pop step from the move queue", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executeMove(infantry.order);

            //Then
            expect(infantry.order.queue).toEqual([{y: 3, x: 3}]);
        });
        it("should clear the order when no more moves need to be done", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Move", queue:[{y: 3, x:3}]};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executeMove(infantry.order);

            //Then
            expect(infantry.order).toBeNull();
            
        });
    });
    describe("executePatrol method", function(){
        it("should return the next move step", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x: 2});
        });
        it("should initialize the index on 1", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3}]};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(1);
        });
        it("should increase index in the queue", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(2);
        });
        it("should return the next item on the path", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 3, x:3});
        });
        it("should move back the index when at the end", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 2};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(infantry.order.index).toEqual(1);
        });
        it("should reverse the order when done", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 2};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 4, x:4});
            expect(infantry.order.reverse).toBeTruthy();

        });
        it("should keep moving back when in reverse", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 1, reverse: true};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 3, x:3});
            expect(infantry.order.index).toEqual(0);
            expect(infantry.order.reverse).toBeTruthy();

        });
        it("should reverse the order when back at the start", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4}], index: 0, reverse: true};
            var ordersInstance = new orders(infantry);

            //When
            var result = ordersInstance.executePatrol(infantry.order);

            //Then
            expect(result).toEqual({y: 2, x:2});
            expect(infantry.order.index).toEqual(1);
            expect(infantry.order.reverse).toBeFalsy();

        });
        it("should loop nicely", function(){
            //Given
            var infantry = new unit("I", {y: 1, x:1});
            infantry.order ={action: "Patrol", queue:[{y: 2, x:2},{y: 3, x:3},{y: 4, x:4},{y: 5, x:5}]};
            var ordersInstance = new orders(infantry);

            //When
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 2, x:2});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 5, x:5});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 2, x:2});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 3, x:3});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 4, x:4});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 5, x:5});
            expect(ordersInstance.executePatrol(infantry.order)).toEqual({y: 4, x:4});
        });
    });
    describe("executeRoam method", function(){
        it("should not change direction in 90% of the time", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").and.returnValue(1-0.9);
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");
            
            //When
            var result = ordersInstance.executeRoam(infantry.order);

            //Then
            expect(ordersInstance.goDirection).toHaveBeenCalledWith("S")
        });
        it("should change direction in 10% of the time", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").and.returnValue(0.9);
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");

            //When
            var result = ordersInstance.executeRoam(infantry.order);

            //Then
            expect(ordersInstance.goDirection).toHaveBeenCalledWith("SE")
        });
        it("should return the updated position", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam", direction: "S"};
            spyOn(Math, "random").and.returnValue(0.9);
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");

            //When
            var result = ordersInstance.executeRoam(infantry.order);

            //Then
            expect(result).toEqual("updated position")
        });
        it("should initialize a direction when non present", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Roam"};
            spyOn(Math, "random").and.returnValue(0.4);
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");

            //When
            var result = ordersInstance.executeRoam(infantry.order);

            //Then
            expect(infantry.order.direction).toEqual("S")
        });
    });
    describe("executeDirection method", function(){
        it("should go in the directoin of the order", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Direction", direction: "direction"};
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");

            //When
            var result = ordersInstance.executeDirection(infantry.order);

            //Then
            expect(ordersInstance.goDirection).toHaveBeenCalledWith("direction")
        });
        it("should return the updated position", function(){
            //Given
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order ={action: "Direction", direction: "S"};
            var ordersInstance = new orders(infantry);
            spyOn(ordersInstance, "goDirection").and.returnValue("updated position");

            //When
            var result = ordersInstance.executeDirection(infantry.order);

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
            var infantry = new unit("I", {y: 3, x:2});
            var ordersInstance = new orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").and.returnValue({y: 4, x: 2});
            
            //When
            ordersInstance.goDirection("W");

            //Then
            expect(unitsmap.map.move).toHaveBeenCalledWith("W", {y: 3, x: 2});
        });
        it("should return new coordinates", function(){
            //Given
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            var ordersInstance = new orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").and.returnValue({y: 4, x: 2});

            //When
            var result = ordersInstance.goDirection("W");

            //Then
            expect(result).toEqual({y: 4, x: 2});
        });
         it("should return null when unit hasn't moved (map border)", function(){
            //Given
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            var ordersInstance = new orders(infantry, unitsmap);
            spyOn(unitsmap.map, "move").and.returnValue({y: 3, x: 2});

            //When
            var result = ordersInstance.goDirection("W");

            //Then
            expect(result).toBeNull();
        });
    });
    describe("newEnemies method", function(){
        it("should lazy initialize foes on order", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order={};
            var ordersInstance = new orders(infantry, unitsmap);

            ordersInstance.newEnemies(["foo", "bar"])

            expect(infantry.order.foes).toEqual(["foo", "bar"]);
        });
        it("should return true on first encountering of enemies", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order={};
            var ordersInstance = new orders(infantry, unitsmap);

            var result = ordersInstance.newEnemies(["foo", "bar"])

            expect(result).toBeTruthy();
        });
        it("should return false on reencountering of same enemies", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order={foes: ["foo", "bar"]};
            var ordersInstance = new orders(infantry, unitsmap);

            var result = ordersInstance.newEnemies(["foo", "bar"])

            expect(result).toBeFalsy();
        });
        it("should return true on  new encountering of enemy", function(){
            var unitsmap = {map: {move: function(){}}}
            var infantry = new unit("I", {y: 3, x:2});
            infantry.order={foes: ["foo", "bar"]};
            var ordersInstance = new orders(infantry, unitsmap);

            var result = ordersInstance.newEnemies(["foe", "bar"])

            expect(result).toBeTruthy();
        });
    });
});