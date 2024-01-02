import {NAVIGATIONS_OFFSETS} from "./navigtion.mjs";
import {city, CITY_NAMES} from "./city.mjs";

export function gameMap(data) {
    this.data = [];
    this.cities = [];
    this.cityLookUp={};

    this.guardData = () => {
        if (!data) {
            throw "Map data undefined";
        }
        this.height = data.dimensions.height;
        if (this.height === undefined || this.height === 0) {
            throw "Empty map not allowed";
        }
        this.width = data.dimensions.width;
        if (this.width === undefined || this.width === 0) {
            throw "Map has no width";
        }
        if(data.world.length !== this.height){
            console.log(data);
            throw "Map has inconsistent height";
        }
        if (!data.world.every((row) => row.length === this.width)) {
            throw "Map has inconsistent width";
        }
    }

    this.inflateMap = () => {
        const dimensions = data.dimensions;
        const flatWorld = data.world;
        const world = [];
        for (var y = 0; y < dimensions.height; y++) {
            const row = [];
            world.push(row);
            for (var x = 0; x < dimensions.width; x++) {
                const type = flatWorld[y][x];
                row.push({"type": type});
            }
        }
        this.data = world;
        this.dimensions = data.dimensions;
    }

    this.dimensions = () => {
        return this.dimensions;
    }

    this.world = () => {
        return {dimensions: this.dimensions, world: this.data};
    }

    this.createCities = () => {
        var availableCities = [].concat(CITY_NAMES);
        data.cities.forEach((coordinate) => {
            var cityName = availableCities.shift();
                if (!cityName) {
                    throw "No more cities available. This map contains to many cities(>" + CITY_LIST.length + ")";
                }
                this.cities.push(new city({y: coordinate[0], x: coordinate[1]}, cityName));
        });
        this.cities.forEach((c) => {
            this.cityLookUp[`${c.position.x},${c.position.y}`] = c
        });
    }

    this.init = () => {
        this.guardData();
        this.inflateMap();
        this.createCities();
    };

    this.position = (pos) => {
        return this.at(pos.y, pos.x);
    };

    this.type = (position) => {
        return this.data[position.y][position.x].type;
    };
    this.at = (y, x) => {
        switch (data[y][x].type) {
            case "L": return "land";
            case "S": return "sea";
            case "M": return "mountain";
            default : return null;
        }
    };
    this.cityAt = (y, x) => {
        const result = this.cityLookUp[`${x},${y}`];
        return result?result:null;
    };
    this.size = () => {
        return this.height*this.width;
    }
    this.range = (position, radius) => {
        var from_x = position.x - radius.x;
        var from_y = position.y - radius.y;
        var to_x = position.x + radius.x;
        var to_y = position.y + radius.y;
        var x_correction = 0;
        var y_correction = 0;
        if (from_x < 0) {
            x_correction = 0 - from_x;
        }
        else {
            if (to_x >= this.width) {
                x_correction = this.width - to_x - 1;
            }
        }
        if (from_y < 0) {
            y_correction = 0 - from_y;
        }
        else {
            if (to_y >= this.width) {
                y_correction = this.height - to_y - 1;
            }
        }
        return  {
            position: position,
            from: {x: from_x + x_correction, y: from_y + y_correction},
            to: {x: to_x + x_correction, y: to_y + y_correction}
        };
    };
    this.move = (direction, position) => {
        var clone = {x: position.x, y:position.y};
        var offset = _.detect(NAVIGATIONS_OFFSETS, function(item) {
            return item.direction === direction;
        });
        clone.x += offset.x;
        clone.y += offset.y;
        clone.x = Math.max(clone.x, 0);
        clone.x = Math.min(clone.x, this.width - 1);
        clone.y = Math.max(clone.y, 0);
        clone.y = Math.min(clone.y, this.height - 1);
        return clone;
    };

    this.init();
};