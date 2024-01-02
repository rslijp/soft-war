import {applyTraitsOn} from "./traits-util.mjs";

export const PLAYER_COLORS = ['orange', 'cyan', 'magenta', 'darkgrey'];

export const playerTraits = {
   contactedEnemy: false,
   turn: 0,
   enemySpottedThisTurn: {},
    initTurn: function(stateEngine) {
        this.turn += 1;
        this.endTurnPhase = false;
        _.each(this.units, function(unit) {
            unit.initTurn();
        });
        this.carrousel = new Model.UnitCarrousel(this.units);
        this.enemySpottedThisTurn={};
        return this;
   },
   endTurn: function() {
       if(this.isRoaming()){
           this.updateRoaming();
       }
       _.each(this.units, function(unit) {
           unit.endTurn();
       });
   },
   enemySpotted: function(foes, by){
        this.contactedEnemy=true;
       if(!this.enemySpottedThisTurn[by]){this.enemySpottedThisTurn[by]=foes;}
       else {this.enemySpottedThisTurn[by]=this.enemySpottedThisTurn[by].concat(foes);}
       _.uniq(this.enemySpottedThisTurn[by]);
   },
   looses: function(){
        this.state="lost";
        Service.Bus.send("player-looses", this);
   },
   roaming: function(){
        if(!this.isRoaming()){
            this.state="roaming";
            this.turnsRoaming=10;
            Service.Bus.send("player-roaming", this);
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
        return _.size(this.units)>0;
   },
   hasAnyCities: function() {
        return _.size(_.filter(this.units, function(unit){return unit.clazz=="city"}))>0;
   }        
}

export function applyPlayerTraitsOn(target){
    applyTraitsOn(playerTraits, target);
}