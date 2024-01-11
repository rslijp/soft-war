export function fogOfWar (data, map) {
    this.data = data;
    this.discoveredTiles=0;
    this.update = function(position, radius, value) {
        for (var y = position.y - radius; y <= position.y + radius; y++) {
            const nY = map.normalize({y: y, x: 0}).y;
            if (!data[nY]) {
                data[nY] = [];
            }
            for (var x = position.x - radius; x <= position.x + radius; x++) {
                var r = Math.sqrt(((y - position.y) * (y - position.y)) + ((x - position.x) * (x - position.x)));
                if (r <= radius) {
                    const r = map.normalize({y: nY, x: x});
                    if (!data[r.y][r.x]) {
                        this.discoveredTiles+=1;
                        data[r.y][r.x] = 0;
                    }
                    data[r.y][r.x] += value;
                }
            }
        }
    };
    this.range = function(position, radius) {
        const result = [];
        for (var y = position.y - radius; y <= position.y + radius; y++) {
            const nY = map.normalize({y: y, x: 0}).y;
            for (var x = position.x - radius; x <= position.x + radius; x++) {
                var r = Math.sqrt(((y - position.y) * (y - position.y)) + ((x - position.x) * (x - position.x)));
                if (r <= radius) {
                    const n = map.normalize({y: nY, x: x});
                    result.push(n);
                }
            }
        }
        return result;
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
    this.prettyPrint = () => {
        for(var y=0;y<data.length; y++){
            var row = "";
            if(data[y]){
                for(var x=0;x<(data[y]||[]).length; x++){
                    row=row+(data[y][x]||0);
                }
                console.log(y+":", row);
            }
        }
    }
};