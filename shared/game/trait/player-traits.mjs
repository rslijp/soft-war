import {applyTraitsOn} from "./traits-util.mjs";
import {unitCarrousel} from "../unit-carrousel.mjs";

export const PLAYER_COLORS = ['orange', 'cyan', 'magenta', 'darkgrey'];

export const playerTraits = {
   contactedEnemy: false,
   id:1,
   turn: 0,
   enemySpottedThisTurn: {},
    initTurn: function(stateEngine) {
        this.turn += 1;
        this.endTurnPhase = false;
        this.units.forEach((unit) => {
            unit.initTurn();
        });
        this.carrousel = new unitCarrousel(this.units);
        this.enemySpottedThisTurn={};
        return this;
   },
   endTurn: function() {
       if(this.isRoaming()){
           this.updateRoaming();
       }
       this.units.forEach((unit) => {
           unit.endTurn();
       });
   },
   enemySpotted: function(foes, by){
        this.contactedEnemy=true;
       if(!this.enemySpottedThisTurn[by]){this.enemySpottedThisTurn[by]=foes;}
       else {this.enemySpottedThisTurn[by]=this.enemySpottedThisTurn[by].concat(foes);}
       this.enemySpottedThisTurn[by].unique();
   },
   looses: function(){
        this.state="lost";
        Service.Bus.send("player-looses", this);
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
        Service.Bus.send("player-wins", this);
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
        return (this.units||[]).filter((unit)=>{return unit.clazz=="city"})>0;
   },
   nextId: function (){
       const id = this.id;
       this.id++;
       return id;
   }
}

export function applyPlayerTraitsOn(target){
    applyTraitsOn(playerTraits, target);
}