import MessageBus from "../services/message-service.mjs";
import {fogOfWar} from "./fog-of-war.mjs";
import {applyPlayerTraitsOn} from "./trait/player-traits.mjs";

export function aiPlayer(index, name, color, units) {
    this.state="START";
    this.fogOfWar = new fogOfWar([]);
    this.index = index;
    this.units = units;
    this.name = name;
    this.color = color;
    this.hostileCities={};

    this.init = () => {
        units.forEach((unit) => {
            unit.player = index;
            this.fogOfWar.add(unit);
        });
    }

    this.enemyCitySpotted=function(foes, by){
        foes.forEach((unit) => {
           if(unit.clazz=='city'){
               this.hostileCities[unit.name]=unit;
           }
       });
    }
    this.enemyCityConquered = function(cityDefense, player) {
        var city = cityDefense.city;
        if (player.index===self.index) {
            self.hostileCities[city.name]=undefined;
        } else {
            self.hostileCities[city.name]=city;
        }
    };

    applyPlayerTraitsOn(this);
    this.init();

    MessageBus.register("enemy-spotted", this.enemySpotted, this);
    MessageBus.register("enemy-spotted", this.enemyCitySpotted, this);
    MessageBus.register("city-defense-destroyed", this.enemyCityConquered, this);
}