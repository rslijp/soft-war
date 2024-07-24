import {applyUnitTraitsOn} from "./trait/unit-traits.mjs"
import {unitTypes} from "./unit-types.mjs"
import MessageBus from "../services/message-service.mjs";
import {applyTraitsOn} from "./trait/traits-util.mjs";

export function unit(type, position) {
    this.id = "";
    this.position = position;
    this.type = type;
    this.definition = () => {
        return unitTypes[type];
    };
    this.health = this.definition().health;
    this.sight = this.definition().sight;
    this.nestedUnits = [];
    this.player = null;
    this.inside = null;
    this.clazz = "unit";
    this.blitzed = false;
    this.capacity = this.definition().capacity;

    this.isAlive= () => {
        return this.health>0;
    };

    this.canMoveOn = (type) => {
        let isString = value => typeof value === 'string' || value instanceof String;
        if(!isString(type)){
            type = type.type;
        }
        return this.definition().allowed.indexOf(type)>-1;
    };
    this.canMove = (blitz) => {
        if(this.health <= 0) {
            return false;
        } else if(blitz &&!this.blitzed){
            return true;
        }
        return this.movesLeft > 0;              
    };
    this.onLoad = () => {
        var fuel = this.definition().fuel;
        if (fuel) {
            this.fuel = fuel;
        }
    };
    this.hasSight=function(){
        return this.health>0;
    };
    this.heal=function(){
        if(!this.isAlive()) return;
        if(this.health < this.definition().health){
            this.health++;
        }

    };
    this.move = (to, blitz) => {
        if (!this.canMove(blitz||false)) {
            throw "Unit can't move in this turn";
        }
        this.position = to;
        if(!blitz) this.movesLeft-=1;
        if (this.definition().fuel) {
            this.fuel -= 1;
            this.fuel = Math.max(this.fuel, 0);
            if (!blitz && this.fuel <= 0) {
                this.health = 0;
                MessageBus.send("unit-out-of-fuel", this);
            }
        }
    };
    this.canLoad = function(unit, ignoreMoves) {
        var definition = this.definition();
        if (!definition.canLoadUnits) {
            return false;
        }
        if ((definition.canLoadUnits||[]).indexOf(unit.type) === -1) {
            return false;
        }
        if (this.nestedUnits.length >= definition.capacity) {
            return false;
        }
        if (!ignoreMoves && !unit.canMove()) {
            return false;
        }
        if (unit.player !== this.player) {
            return false;
        }
        return true;
    };
    this.disembark = (to) => {
        var transport = this.inside;
        if (transport) {
            transport.unload(this);
            this.position = transport.position;
            this.move(to);
        }
    };
    this.embark = (transport ,blitz) => {
        if (transport) {
            transport.load(this, blitz);
        }
    };
    this.initTurn = () => {
        this.blitzed=false;
        this.movesLeft = this.definition().moves;
        this.internalInit();
        if (this.specialInit) {
            this.specialInit();
        }
        return this;
    };
    this.endTurn = () => {
    };
    this.remark = () => {
        return this.innerRemark();
    };
    this.derivedPosition = () => {
        var result = null;
        if (this.inside !== null) {
            result = this.inside.derivedPosition();
        } else {
            result = {y: this.position.y, x: this.position.x};
        }
        var remark = this.remark();
        if (remark) {
            result.remark = remark;
        }
        return result;
    };
    this.modifiers = (opponent, ground) => {
        var self = this;
        var allModifiers = this.definition().modifiers || [];
        var modifiers = allModifiers.filter((modifier) => {
            return modifier.applicable(self, opponent, ground);
        });
        return modifiers;
    };

    this.attack = (target) => {
        if (!this.canMove()) {
            throw "Unit can't attack in this turn";
        }
        if (target.clazz === "unit") {
            this.movesLeft -= 1;
            MessageBus.send("battle", this, target, target.derivedPosition(), true);
        }
        else if(this.canConquerCities()){
            this.movesLeft -= 1;
            MessageBus.send("city-under-siege", this, target, target.derivedPosition());
        }
        else {
            return false;
        }
    };


    this.canConquerCities = ()=> {
        return this.definition().groundForce;    
    };

    this.getName = () => {
        return this.getShortName()+" army";
    }

    this.getShortName = () => {
        if(this.id===1) { return "1st"; }
        else if(this.id===2) { return "2nd"; }
        else if(this.id===3) { return "3rd"; }
        else { return this.id+"nd"; }
    }

    applyUnitTraitsOn(this);
    if (this.definition().mixin) {
        applyTraitsOn("unit-type", this.definition().mixin, this, ["remark"]);
    }
};