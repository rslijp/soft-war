import MessageBus from "../services/message-service.mjs";

export function statistics(player) {
    var self = this;
    this.player=player;
    
    this.turns = 0;
    this.units=1;
    this.history=[];
    this.cities=1;

    this.newTurn = (messages, player) => {
        if (player !== self.index) {
            return;
        }
        this.turns+=1;
        this.history.push({units: this.units, cities: this.cities, power: this.cities+this.units});
    };

    this.unitDestroyed = (unit) => {
        if (unit.player !== self.index) {
            return;
        }
        this.units-=1;
    };

    this.unitCreated = (city, unit) => {
        if (unit.player !== self.index) {
            return;
        }
        this.units+=1;
    };

    this.unitCreated = function(){
        this.units+=1;
    };

    this.cityFallen = (city) => {
        if (city.player != self.index) {
            return;
        }
        this.cities-=1;
    };

    this.cityConquered = (city) => {
        if (city.player != self.index) {
            return;
        }
        this.cities+=1;
    }

    MessageBus.register("new-turn", this.newTurn, this);
    MessageBus.register("unit-destroyed", this.unitDestroyed, this);
    MessageBus.register("unit-created", this.unitCreated, this);
    MessageBus.register("city-defense-destroyed", this.cityFallen, this);
    MessageBus.register("city-conquered", this.cityConquered, this);
}
