import {applyTraitsOn} from "./traits-util.mjs";
import {unitCarrousel} from "../unit-carrousel.mjs";
import {MessageBus} from "../../index.js";

export const PLAYER_COLORS = ['orange', 'cyan', 'magenta', 'darkgrey'];

export const playerTraits = {
   contactedEnemy: false,
   unitId:1,
   turn: 0,
   enemySpottedThisTurn: {},
    initTurn: function(stateEngine) {
        this.turn += 1;
        this.endTurnPhase = false;
        this.units.forEach((unit) => {
            unit.initTurn();
            (unit.nestedUnits||[]).forEach((nestedUnit) => {
                nestedUnit.initTurn();
            });
        });
        this.carrousel = new unitCarrousel(this.units);
        this.enemySpottedThisTurn={};
        if(this.autoNextFlag) {
            this.selectedUnit=this.carrousel.next()
        }
        return this;
   },
   endTurn: function() {
       if(this.isRoaming()){
           this.updateRoaming();
       }
       this.units.forEach((unit) => {
           unit.endTurn();
       });
       this.onEndTurn();
   },
   onEndTurn: function(){

   },
   enemySpotted: function(foes, by){
        this.contactedEnemy=true;
       if(!this.enemySpottedThisTurn[by]){this.enemySpottedThisTurn[by]=foes;}
       else {this.enemySpottedThisTurn[by]=this.enemySpottedThisTurn[by].concat(foes);}
       this.enemySpottedThisTurn[by]=[...new Set(this.enemySpottedThisTurn[by])]
   },
   looses: function(){
        this.state="lost";
        MessageBus.send("player-looses", this);
   },
   roaming: function(){
        if(!this.isRoaming()){
            this.state="roaming";
            this.turnsRoaming=10;
            MessageBus.send("player-roaming", this);
        }
   },
   wins: function(){
        this.state="won";
        MessageBus.send("player-wins", this);
   },
   hasLost: function(){
        return this.state=="lost";
   },
   hasWon: function(){
        return this.state=="won";
   },
   isRoaming: function(){
        return this.state=="roaming";
   },
   updateRoaming: function(){
       this.turnsRoaming-=1;
       if(this.hasAnyCities()){
           this.state="playing";
           delete this.turnsRoaming;
       } else if(this.turnsRoaming==0){
           this.looses();
       }
   },
   hasAnyUnits: function() {
        return (this.units||[]).length>0;
   },
   hasAnyCities: function() {
        return (this.units||[]).filter((unit)=>{return unit.clazz=="city"}).length>0;
   },
   nextId: function (){
       const id = this.unitId;
       this.unitId++;
       return id;
   },
    cursorUpdate: function(to) {
        var unit = this.selectedUnit;
        if (!unit) {
            this.position = to;
            return true;
        }
        if(unit.clazz==='city'){
            return false;
        }
        if (unit.order) {
            MessageBus.send("confirm-order", unit);
            return false;
        }
        this.fogOfWar.remove(unit);
        var succes = this.unitsMap.move(unit, to);
        if(unit.isAlive()){
            this.fogOfWar.add(unit);
            this.position = unit.derivedPosition();
        }
        if (succes) {
            this.jumpToNextUnit(unit);
        }
        return true;
    },
    jumpToNextUnit: function(unit) {
        const innerAutoNext = () => {
            if (this.selectedUnit === unit) {
                MessageBus.send("next-unit");
            }
        }
        if (unit && !unit.canMove() && this.autoNext()) {
            setTimeout(innerAutoNext, 1500);
        }
    },
    registerUnit: function(city, unit) {
        if (unit.player != this.index) {
            return;
        }
        if(unit.clazz=="unit"){
            unit.id= this.nextId();
        }
        if(this.onRegisterUnit){
           this.onRegisterUnit(unit)
        }
        this.units.push(unit);
    },
    unregisterUnit: function(unit) {
        var index = this.units.indexOf(unit);
        if (index >= 0) {
            this.units.splice(index, 1);
        }
    },
    unregisterChilds: function (unit) {
        if (unit.nestedUnits.length > 0) {
            unit.nestedUnits.forEach((child) => {
                this.unregisterUnit(child);
            });
        }
    },
    destroyed: function(unit, aggressor) {
        if (unit.player != this.index) {
            return;
        }
        this.unregisterChilds(unit);
        this.unregisterUnit(unit);
        if(aggressor && this.index != aggressor.index) {
            this.fogOfWar.remove(unit, true);
        }
        if (this.selectedUnit == unit) {
            this.cursorSelect(null);
        }
        MessageBus.send("game-state-changed", this.index);

    },
    findNextMoveableUnit: function (current){
       if(!current) {
           return this.units[0];
       }
       var currentIndex = this.units.indexOf(current);
       for(var i=currentIndex; i<this.units.length; i++){
            if(this.units[i].canMove()) return this.units[i];
       }
       for(var i=0; i<currentIndex; i++){
            if(this.units[i].canMove()) return this.units[i];
       }
       return this.units[currentIndex+1] || this.units[0];
    },
    init: function (){
        ([].concat(this.units)).forEach((unit) => {
            unit.player = this.index;
            if(!unit.inside) this.fogOfWar.add(unit);
            if(unit.clazz === 'unit'){
                unit.id=this.nextId();
            }
            (unit.nestedUnits||[]).forEach(nestedUnit => {
                nestedUnit.player = this.index
                nestedUnit.id=this.nextId();
            });

        });
       if(this.autoNextFlag) {
           this.selectedUnit=this.carrousel.next()
           this.position = this.selectedUnit.derivedPosition();
       } else {
           const selectable = this.units.find(u => u.clazz === 'unit');
           if (selectable) {
               this.position = selectable.position;
               this.selectedUnit = selectable;
           } else if (this.units[0]) {
               this.position = this.units[0].position;
           }
       }
    }
}

export function applyPlayerTraitsOn(target){
    applyTraitsOn("player", playerTraits, target, [], ['onEndTurn']);
}