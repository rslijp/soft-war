export function unitCarrousel(units) {
    let queue = units.slice(0);
    let _current = null;

    function keeper(subject) {
        var intransport = subject.inside && subject.inside.clazz == "unit";
        var fortified = subject.fortified === true;
        var alive = subject.health > 0;
        return (alive && subject.canMove() && !(intransport || fortified));
    }

    function skip() {
        while (queue.length > 0) {
            if (keeper(queue[0])) {
                return;
            }
            queue.shift();
        }
    }

    this.next = function() {
        skip();
        _current = null;
        if (queue.length > 0) {
            _current = queue.shift();
        }
        return _current;
    };
    this.current = function() {
        return _current;
    };
    this.hasMore = function() {
        skip();
        return queue.length > 0;
    };
    this.reschedule = function(target) {
        if (target === _current) {
            queue.push(target);
            _current = undefined;
        } else {
            queue = queue.filter(c=>c!==target);
            queue.push(target);
        }
    };
    this.allOrdersFinished = function() {
        queue = queue.filter(unit => keeper(unit));
        var anyOrders = queue.every(unit=> !unit.order);
        return anyOrders;
    };
    this.dropNonOrderUnits = function() {
        queue = queue.filter(unit=>unit.order !== null);
    };
    skip();
};