import MessageBus from "../services/message-service.mjs";

export function unitsMap(players, map) {
    this.map = map;
    this.data = [];
    this.addRange = (units) => {
        units.forEach((unit) => {
            this.add(unit);
        });
    };
    this.destroyed = (unit) => {
        if (unit.inside) {
            var city = unit.inside;
            city.destroyed(unit);
        } else {
            this.remove(unit.position);
        }
    };
    this.remove = (position) => {
        var unitsRow = this.data[position.y];
        if (!unitsRow) {
            return null;
        }
        var unit = unitsRow[position.x];
        unitsRow[position.x] = null;
        return unit;
    };
    this.move = (unit, to, blitz) => {
        var target = this.get(to);
        var position = unit.position;
        if (!unit.canMove(blitz)) {
            return false;
        }
        if (target) {
            return this.collision(unit, target, to, position, blitz);
        }
        if (!unit.canMoveOn(this.map.type(to))) {
            return false;
        }
        if (!unit.inside) {
            unit = this.remove(position);
            unit.move(to);
        } else {
            unit.disembark(to);
        }
        this.add(unit);
        var foes = this.enemyNearyBy(unit, unit.sight);
        if(foes.length>0) MessageBus.send("enemy-spotted", foes, unit);
        return true;
    };
    this.collision = (unit, collision, at, from, blitz) => {
        if (unit.player != collision.player) {
            unit.attack(collision);
        } else {
            if (collision.canLoad(unit, blitz)) {
                if (unit.inside) {
                    var transport = unit.inside;
                    transport.unload(unit);
                } else {
                    this.remove(unit.position);
                }
                unit.embark(collision, blitz);
                MessageBus.send("unit-loaded", from, unit);
                return true;
            }
        }
        return false;
    };
    this.add = (unit) => {
        if (unit.health <= 0) {
            return;
        }
        var position = unit.position;
        if (!this.data[position.y]) {
            this.data[position.y] = [];
        }
        if (this.data[position.y][position.x]) {
            throw "Cannot add units to the same position " + JSON.stringify(position);
        }
        this.data[position.y][position.x] = unit;
    };

    this.unitAt = (y,x) => {
        var unitsRow = this.data[y];
        if (!unitsRow) {
            return null;
        }
        return unitsRow[x];
    };

    this.get = (position) => {
        var unitsRow = this.data[position.y];
        if (!unitsRow) {
            return null;
        }
        return unitsRow[position.x];
    };
    this.enemyNearyBy = (unit, sight) => {
        var position = unit.derivedPosition();
        var radius = sight ? sight : unit.sight;
        var foes = [];
        for (var y = position.y - radius; y <= position.y + radius; y++) {
            for (var x = position.x - radius; x <= position.x + radius; x++) {
                var r = sight == 1 ? sight : Math.sqrt(((y - position.y) * (y - position.y)) + ((x - position.x) * (x - position.x)));
                if (r <= radius) {
                    var candidate = this.get({y: y, x: x});
                    if (candidate && candidate.player != unit.player) {
                        foes.push(candidate);
                    }
                }
            }
        }
        return foes;
    };

    var self = this;

    this.addOrLoadRange = (units) => {
        units.forEach((unit) => {
            var transport = self.get(unit.derivedPosition());
            if (transport && transport.canLoad(unit, true)) {
                transport.internalLoad(unit);
            }
            else {
                self.add(unit);
            }
        });
    };

    this.initPlayer = (player) => {
        this.addRange(player.units.filter((unit) => {
            return unit.clazz === "city";
        }));
        this.addOrLoadRange(player.units.filter((unit) => {
            return unit.clazz === "unit";
        }));
    }

    this.init = () => {
        if (!players || !map) {
            return;
        }
        players.forEach((player) => this.initPlayer(player));
        if (map.cities) {
            self.addRange(map.cities.filter((city) => {
                return city.player === null;
            }));
        }
    }

    MessageBus.register("move-unit", this.move, this);
    MessageBus.register("unit-loaded", this.remove, this);
    MessageBus.register("unit-destroyed", this.destroyed, this);
    MessageBus.register("unit-out-of-fuel", this.destroyed, this);

    this.init();
};