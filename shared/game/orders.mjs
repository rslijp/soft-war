import MessageBus from "../services/message-service.mjs";
import {NAVIGATIONS_OFFSETS} from "./navigtion.mjs";

const intersect = (lhs, rhs) => {
    const r = new Set(rhs);
    return lhs.filter(value => r.has(value));
};

const uniq = (values) => {
    return [...new Set(values)];
};

export function orders (unit, unitsmap, player) {
    this.executeOrders = () => {
       MessageBus.lock();
        var done = this.lockedExecuteOrders();
        if (done) {
           MessageBus.unlock();
            player.jumpToNextUnit(unit);
        }
    };
    this.lockedExecuteOrders = () => {
        if (unit.order && unit.canMove()) {
            var foes = unitsmap.enemyNearyBy(unit, 1);
            if (this.newEnemies(foes)) {
               MessageBus.send("unit-order-attention", unit, unit.order);
                return true;
            }
            if (!this.executeAction(unit.order)) {
                return true;
            }

            return this.nextOrder();
        } else {
            return true;
        }

    };
    this.newEnemies = (foes) => {
        if (foes.length === 0) {
            return false;
        }
        var order = unit.order;
        if (!order.foes) {
            order.foes = [];
        }
        var newFoes = foes.length - intersect(order.foes, foes).length;
        order.foes = uniq(order.foes.concat(foes));
        return newFoes > 0;
    };
    this.nextOrder = () => {
        var self = this;
        setTimeout(() => {
            self.executeOrders();
        }, 250);
        return false;
    };
    function cloneOrder(order) {
        var clone = {...order};
        if (order.queue) {
            clone.queue = [...order.queue];
        }
        return clone;
    }

    this.executeAction = (order) => {
        var oldOrder = cloneOrder(order);
        var action = order.action;
        action = action.substring(0, 1).toUpperCase() + action.substring(1);
        var step = this["execute" + action](order);
        player.fogOfWar.remove(unit);
        var succes = step && unitsmap.move(unit, step);
        player.fogOfWar.add(unit);
        if (succes) {
            player.position = step;
            MessageBus.send("unit-order-step", unit, order);
            return true;
        } else {
            if (step) {
                unit.order = oldOrder;
            }
            MessageBus.send("unit-order-attention", unit, order);
            return false;
        }
    };
    this.executeMove = (order) => {
        var step = order.queue.shift();
        if (order.queue.length === 0) {
            unit.order = null;
        }
        return step;
    };
    this.executePatrol = (order) => {
        if (order.index === undefined) {
            order.index = 0;
        }
        var step = order.queue[order.index];
        if (!order.reverse && order.index === order.queue.length - 1) {
            order.reverse = true;
        }
        if (order.reverse && order.index === 0) {
            order.reverse = false;
        }
        if (order.reverse) {
            order.index -= 1;
        }
        else {
            order.index += 1;
        }
        return step;
    };
    this.executeRoam = (order) => {
        var changeDirection = order.direction === undefined || Math.random() >= 0.9;
        if (changeDirection) {
            order.direction = NAVIGATIONS_OFFSETS[Math.floor(Math.random() * NAVIGATIONS_OFFSETS.length)].direction;
        }
        return this.goDirection(order.direction);
    };
    this.executeDirection = (order) => {
        return this.goDirection(order.direction);
    };
    this.goDirection = (direction) => {
        var current = unit.derivedPosition();
        var to = unitsmap.map.move(direction, current);
        return (to.y === current.y && to.x === current.x) ? null : to;
    };
};