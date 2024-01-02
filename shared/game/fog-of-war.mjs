export function fogOfWar (data) {
    this.data = data;
    this.discoveredTiles=0;
    this.update = function(position, radius, value) {
        for (var y = position.y - radius; y <= position.y + radius; y++) {
            if (!data[y]) {
                data[y] = [];
            }
            for (var x = position.x - radius; x <= position.x + radius; x++) {
                var r = Math.sqrt(((y - position.y) * (y - position.y)) + ((x - position.x) * (x - position.x)));
                if (r <= radius) {
                    if (!data[y][x]) {
                        this.discoveredTiles+=1;
                        data[y][x] = 0;
                    }
                    data[y][x] += value;
                }
            }
        }
    };
    this.add = function(unit) {
        if (unit.position && unit.hasSight()) {
            this.update(unit.position, unit.sight, 1);
        }
    };
    this.remove = function(unit, destroyed) {
        if (unit.position && (unit.hasSight() || destroyed)) {
            this.update(unit.position, unit.sight, -1);
        }
    };
    this.visible = function(position) {
        if (!data[position.y]) {
            return false;
        }
        if (!data[position.y][position.x]) {
            return false;
        }
        return data[position.y][position.x] > 0;
    };
    this.discovered = function(position) {
        if (data[position.y] === undefined) {
            return false;
        }
        return data[position.y][position.x] !== undefined;
    };
};