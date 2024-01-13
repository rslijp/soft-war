import {applyPlayerTraitsOn} from "./trait/player-traits.mjs";
import {fogOfWar} from "./fog-of-war.mjs";
import MessageBus from "../services/message-service.mjs";
import {unitCarrousel} from "./unit-carrousel.mjs";

export function humanPlayer(index, name, color, units, map) {
    this.fogOfWar = new fogOfWar([], map);
    this.position = {x: 0, y: 0};
    this.messages = [];
    this.carrousel = new unitCarrousel([]);
    this.endTurnPhase = false;
    this.autoNextFlag = false;
    this.unitsMap = null;
    this.index = index;
    this.units = units;
    this.name = name;
    this.color = color;
    this.selectedUnit = null;
    this.unitBuildCount=0;
    this.state="playing";
    this.type="Human";
    
    var self = this;

    this.flash = function(msg) {
        this.messages.push(msg);
    };
    this.readMessages = function() {
        var messages = this.messages;
        this.messages = [];
        return messages.length === 0 ? ["No messages"] : messages;
    };

    this.specialAction = function(action) {
        var unit = this.selectedUnit;
        if (!unit) {
            return false;
        }
        if (unit.order) {
            MessageBus.send("confirm-order", unit);
            return false;
        }
        this.fogOfWar.remove(unit);
        unit[action]();
        this.fogOfWar.add(unit);
        this.jumpToNextUnit(unit);
        return true;
    };
    this.unitLoaded = function(at, unit) {
        if (unit.player != self.index) {
            return;
        }
        if (unit.inside.clazz == "unit") {
            this.cursorSelect(unit);
        }
    };
    this.cursorSelect = function(unit) {
        if (!this.selectedUnit || this.selectedUnit != unit) {
            this.updateSelectedUnit(unit);
        } else {
            this.updateSelectedUnit(null);
        }
        return this.selectedUnit;
    };
    this.updateSelectedUnit = function(newUnit) {
        var oldUnit = this.selectedUnit;
        this.selectedUnit = newUnit;
        if (oldUnit && oldUnit.canMove()) {
            this.carrousel.reschedule(oldUnit);
        }
    };
    this.unregisterUnit = function(unit) {
        var index = self.units.indexOf(unit);
        if (index >= 0) {
            self.units.splice(index, 1);
        }
    };

    this.unregisterChilds = function (unit) {
        if (unit.nestedUnits.length > 0) {
            unit.nestedUnits.forEach((child) => {
                self.unregisterUnit(child);
            });
        }
    };
    this.destroyed = function(unit, aggressor) {
        if (unit.player != self.index) {
            return;
        }
        this.unregisterChilds(unit);
        this.unregisterUnit(unit);
        if(aggressor && self.index != aggressor.index) {
            this.fogOfWar.remove(unit, true);
        }
        if (self.selectedUnit == unit) {
            this.cursorSelect(null);
        }
        MessageBus.send("game-state-changed", this.index);

    };
    this.flashDestruction = function(unit, aggressor) {
        if (unit.player != self.index || (aggressor && aggressor.index == self.index)) {
            return;
        }
        var position = unit.derivedPosition();
        this.flash("The " + unit.definition().name + " at (" + position.y + ", " + position.x + ") was destroyed by " + aggressor.name);
    };
    this.flashCityFallen = function(cityDefense, player) {
        var city = cityDefense.city;
        if (city.player != self.index) {
            return;
        }
        var position = city.position;
        this.flash("The city of " + city.name + "(" + position.y + ", " + position.x + ") is fallen into the control of " + player.name);
    };
    this.flashAttack = function(unit, damage) {
        if (unit.player != self.index) {
            return;
        }
        var position = unit.derivedPosition();
        this.flash("The " + unit.definition().name + " at (" + position.y + ", " + position.x + ") was attacked and received " + damage + " points of damage");
    };
    this.flashUnitCreationSuspended = function(city, definition) {
        if (city.player != self.index) {
            return;
        }
        var position = city.position;
        this.flash("The creation of a " + definition.name + " was suspended. The city of " + city.name + "(" + position.y + ", " + position.x + ") has reached is maximum garnison size. " +
                "Move units out of the city to make room.");
    };
    this.flashCityNotProducing = function(city) {
        if (city.player != self.index) {
            return;
        }
        var position = city.position;
        this.flash("The city of " + city.name + "(" + position.y + ", " + position.x + ") isn't producing any units.");
    };
    this.registerUnit = function(city, unit) {
        if (unit.player != self.index) {
            return;
        }
        if(unit.clazz=="unit"){
            this.unitBuildCount+=1;
            unit.tag(this.unitBuildCount+=1);
        }
        this.units.push(unit);
    };
    this.flashUnitCreated = function(city, unit) {
        if (unit.player != self.index) {
            return;
        }
        var position = city.position;
        this.flash("The city of " + city.name + "(" + position.y + ", " + position.x + ") has build a " + unit.definition().name + ".");
    };
       
    this.toggleAutoNext = function() {
        this.autoNextFlag = !this.autoNextFlag;
    };

    this.autoNext = function() {
        return this.autoNextFlag || this.endTurnPhase;
    };

    applyPlayerTraitsOn(this);
    this.init();

    MessageBus.register("unit-destroyed", this.destroyed, this);
    MessageBus.register("unit-destroyed", this.flashDestruction, this);
    MessageBus.register("city-defense-destroyed", this.flashCityFallen, this);
    MessageBus.register("unit-attacked", this.flashAttack, this);
    MessageBus.register("unit-loaded", this.unitLoaded, this);
    MessageBus.register("unit-creation-suspended", this.flashUnitCreationSuspended, this);
    MessageBus.register("unit-created", this.flashUnitCreated, this);
    MessageBus.register("unit-created", this.registerUnit, this);
    MessageBus.register("unit-out-of-fuel", this.destroyed, this);
};