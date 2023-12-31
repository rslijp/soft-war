import {applyUnitTraitsOn} from "./trait/unit-traits.mjs"
import {unitTypes} from "./unit-types.mjs"
import MessageBus from "../services/message-service.mjs";
import {applyTraitsOn} from "./trait/traits-util.mjs";
import {distance} from "../services/navigation-service.mjs";

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

    this.isAlive= () => {
        return this.health>0;
    };

    this.canMoveOn = (type) => {
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
    this.move = (to) => {
        console.log("> move", this.position, distance(this.position, to));
        if (distance(this.position, to) !== 1) {
            return;
        }
        if (!this.canMove(false)) {
            throw "Unit can't move in this turn";
        }
        this.position = to;
        this.movesLeft-=1;
        console.log("< move", this.position);
        if (this.definition().fuel) {
            this.fuel -= 1;
            if (this.fuel <= 0) {
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
            console.log("disembark", to)
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

    this.tag = (id) => {
        if(id===1) { this.id="1st army"; }
        else if(id===2) { this.id="2nd army"; }
        else if(id===3) { this.id="3rd army"; }
        else { this.id=id+"nd army"; }
        return this;
    }
    this.getName = () => {
        return this.id;
    }

    applyUnitTraitsOn(this);
    if (this.definition().mixin) {
        applyTraitsOn(this.definition().mixin, this);
    }
};