import {aiPlayer} from "../game/ai-player.js";
import {game} from "../game/game.mjs";
import {gameMap} from "../game/game-map.js";
import {humanPlayer} from "../game/human-player.js";
import {unit} from "../game/unit.mjs";
import {PLAYER_COLORS} from "../game/trait/player-traits.mjs";

const saveGame = {
    loadNestedUnits: function(rawunit, carryingUnit) {
        var load = rawunit.load || [];
        load.forEach((rawload) => {
            var load = new unit(rawload.type);
            if (!carryingUnit.canLoad(load, true)) {
                throw "Can't load unit";
            }
            carryingUnit.internalLoad(load);
        });
    },
    loadUnits: function(rawunits) {
        const units = [];
        rawunits.forEach((rawunit) => {
            const mainUnit = new unit(rawunit.type, {y: rawunit.y, x: rawunit.x});
            this.loadNestedUnits(rawunit, mainUnit);
            units.push(mainUnit);

        });
        return units;
    },
    loadCities: function(rawcities, map) {
        var cities = [];
        rawcities.forEach((rawcity) => {
            var city = map.cityAt(rawcity.y, rawcity.x);
            if (rawcity.producingType) {
                city.producingType = rawcity.producingType;
                city.production = rawcity.production || 0;
            }
            cities.push(city);
        });
        return cities;
    },
    load: function(rawUnits, rawCities, map) {
        return this.loadUnits(rawUnits).concat(this.loadCities(rawCities, map));
    }
};

export function deserializeGameState(raw, rawPlayers, rawMap){
    var map = new gameMap(rawMap);
    var players = rawPlayers.map((player,i)=>{
        const units = saveGame.load(
            player.units||[],
            player.cities||[],
            map
        );
        if(player.type==='Human'){
            const human = new humanPlayer(i,player.name, PLAYER_COLORS[i], units, map);
            human.autoNextFlag = true
            return human;
        } else
        if(player.type==='AI'){
            return new aiPlayer(i,player.name, PLAYER_COLORS[i], units, map);
        }
    });
    const r = new game(raw, map, players);
    const p = r.currentPlayer();
    if(p) p.initTurn();
    return r;
}
