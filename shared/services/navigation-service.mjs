import {NAVIGATIONS_OFFSETS} from "../game/navigtion.mjs";

export function distance(from, to) {
    return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
}

 export function navigateAStar(map, unit, fogofwar) {
    var origin = unit.derivedPosition();
    this.route = function(to) {
        var iterations = 0;
        var calculations = 0;

        var head = [];
        var goal = undefined;
        var steps = [];
        var headXY = [];

        function make(position, parent, costs, direction, moved) {
            calculations += 1;
            return {position: position, parent: parent, costs: costs, direction: direction, moved: moved};
        }

        function sortedCostIndex(head, node){
            var value = node.costs;
            var low = 0, high = head.length;
            while (low < high) {
                var mid = Math.floor((low + high) / 2);
                if (array[mid].costs < value) low = mid + 1; else high = mid;
            }
            return low;
        }


        function open(node) {
            var i =sortedCostIndex(head, node);
            head.splice(i, 0, node);
            var position = node.position;
            headXY[position.y][node.position.x] = node;
        }

        function removeFromOpen(node) {
            var headY = headXY[node.position.y];
            var existing = headY[node.position.x];
            existing.closed = true;
            return headY[existing.position.x];
        }

        function pop() {
            var node = head.shift();
            while (node.closed) {
                node = head.shift();
                if (!node) {
                    return;
                }
            }
            var position = node.position;
            headXY[position.y][node.position.x] = null;
            return node;
        }

        function onOpen(position) {
            return headXY[position.y][position.x];
        }


        function drop(node) {
            steps[node.position.y][node.position.x] = null;
        }

        function close(node) {
            steps[node.position.y][node.position.x] = node;
        }

        function onClose(position) {
            return steps[position.y][position.x];
        }

        function costs(from, to, penalty, moved) {
            return moved + (penalty ? 0.5 : 0) + ChebyshevDistance(from, to);
        }

        function ChebyshevDistance(from, to) {
            return /*D **/ 1.5 * Math.max(Math.abs(from.y - to.y), Math.abs(from.x - to.x));
        }

        function checkNeighbour(step, offset) {
            var position = step.position;
            var next_y = position.y + offset.y;
            var next_x = position.x + offset.x;
            //Map limitations
            if (next_y < 0 || next_y >= map.height) {
                return;
            }
            if (next_x < 0 || next_x >= map.width) {
                return;
            }
            var next = {y: next_y, x: next_x};
            //unit limitations

            if (!unit.canMoveOn(map.type(next)) || !fogofwar.discovered(next)) {
                return;
            }
            var moved = step.moved + 1;
            var currentCosts = costs(next, to, offset.penalty, moved);
            var existing = onOpen(next);
            if (existing) {
                if (existing.costs >= currentCosts) { //Current route to same location is shorter, so update
                    removeFromOpen(existing);
                }
                else {
                    close({position: next}); //Other route to same location is shorter, so drop
                    return;
                }
            } else {
                existing = onClose(next);
                if (existing) {
                    if (existing.costs > currentCosts) {
                        drop(existing); //Current route to same location is shorter, so drop old route
                    } else {
                        return;
                    }
                }
            }
            open(make(next, step, currentCosts, offset.direction, step.moved + 1));
        }

        function checkNeighbours(step) {
            _.each(NAVIGATIONS_OFFSETS, function(offset) {
                checkNeighbour(step, offset);
            });
        }

        function iteration() {
            iterations += 1;
            var work = pop();
            if (!work) {
                return;
            }
            close(work);
            if (work.position.x === to.x && work.position.y === to.y) {
                goal = work;
                goal.costs = goal.moved;
                return;
            }
            checkNeighbours(work);
        }

        function flatten(path) {
            function asPosition(node, previous) {
                return {y: node.position.y, x: node.position.x, direction: previous ? previous.direction : "X"};
            }

            if (!path) {
                return;
            }
            var route = [asPosition(path)];
            var work = path.parent;
            var previous = path;
            while (work && work.position) {
                route.unshift(asPosition(work, previous));
                previous = work;
                work = work.parent;
            }
            if (route.length > 0 && route[0].x === origin.x && route[0].y === origin.y) {
                route.shift();
            }
            return route;
        }

        function calculate() {
            steps = new Array(map.height);
            headXY = new Array(map.height);

            open(make(origin, null, costs(origin, to, false, 0), null, 0));
            while (head.length > 0 && !goal) {
                iteration();
            }
            return {route: flatten(goal), goal: goal, iterations: iterations, calculations: calculations};
        }

        return calculate();
    };
};
