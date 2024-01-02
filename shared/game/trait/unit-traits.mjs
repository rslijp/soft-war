import {applyTraitsOn} from "./traits-util.mjs";

export const unitTraits = {
    stealth: false,
    internalLoad: function(unit) {
        this.nestedUnits.push(unit);
        unit.position = null;
        unit.inside = this;
        if (unit.onLoad) {
            unit.onLoad();
        }
    },
    internalUnload: function(unit) {
        this.nestedUnits = _.without(this.nestedUnits, unit);
        unit.inside = null;
    },
    unload: function(unit) {
        if (_.indexOf(this.nestedUnits, unit) == -1) {
            throw "Can't unload unit";
        }
        if (!unit.canMove()) {
            return false;
        }
        this.internalUnload(unit);
    },
    load:function(unit, blitz) {
        if (!this.canLoad(unit, blitz)) {
            throw "Can't load unit";
        }
        if(!blitz){
            unit.movesLeft -= 1;
        }
        this.internalLoad(unit);
    },
    isOn:function(on) {
        var position = this.derivedPosition();
        if (!position) {
            return false;
        }
        return position.x === on.x && position.y === on.y;
    },
    internalInit: function() {
        _.each(this.nestedUnits, function(unit) {
            unit.initTurn();
        });
    },
    innerRemark: function() {
        if (this.inside !== null) {
            return "loaded";
        }
    }
};

export function applyUnitTraitsOn(target){
    applyTraitsOn(unitTraits, target);
}