import {aiPlayer} from "../game/ai-player.js";
import {game} from "../game/game.mjs";
import {gameMap} from "../game/game-map.js";
import {humanPlayer} from "../game/human-player.js";
import {unit} from "../game/unit.mjs";
import {PLAYER_COLORS} from "../game/trait/player-traits.mjs";
import {fogOfWar} from "../game/fog-of-war.mjs";
import {generateCode} from "./random-code-service.mjs";

const saveGame = {
    loadNestedUnits: function(rawunit, carryingUnit) {
        var load = rawunit.nestedUnits || [];
        load.forEach((rawload) => {
            var load = new unit(rawload.type);
            if(rawload.health) load.health=rawload.health;
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
            if(rawunit.health!==undefined) mainUnit.health=rawunit.health;
            if(rawunit.fortified!==undefined) mainUnit.fortified=rawunit.fortified;
            if(rawunit.submerged!==undefined) mainUnit.submerged=rawunit.submerged;
            if(rawunit.fuel!==undefined) mainUnit.fuel=rawunit.fuel;
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

export function deserializeGameState(raw){
    var map = new gameMap(raw.map);
    var players = raw.players.map((rawPlayer,i)=>{
        const units = saveGame.load(
            rawPlayer.units||[],
            rawPlayer.cities||[],
            map
        );
        let player = null;
        if(rawPlayer.type==='Human'){
            player = new humanPlayer(i, rawPlayer.id, rawPlayer.name, PLAYER_COLORS[i], units, map);
            player.autoNextFlag = true
        } else
        if(rawPlayer.type==='AI'){
            player = new aiPlayer(i, rawPlayer.id, rawPlayer.name, PLAYER_COLORS[i], units, map);
        }
        if(rawPlayer.fogOfWar) player.fogOfWar = new fogOfWar(rawPlayer.fogOfWar, map);
        return player;
    });
    const r = new game(raw, map, players);
    const p = r.currentPlayer();
    if(p) p.initTurn();
    return r;
}

export function serializeGameState(game){
    const map = game.map;
    const raw =  {
        code: game.code,
        name: game.name,
        at: Date.now(),
        turn: game.turn,
        currentPlayer: game.currentPlayer,
        players: game.players.map(player=>{
            return {
                "id" : player.id,
                "name" : player.name,
                "type" : player.type,
                "cities" : player.units.filter(u=>u.claz==='city').map(u=>{
                    const pos = u.derivedPosition();
                    return {
                        "y" : pos.x,
                        "x" : pos.x,
                        "producingType" : u.producingType,
                        "production": u.production||0
                    }
                }),
                "units": player.units.filter(u=>u.claz==='unit'&&!u.inside).map(u=>{
                    const pos = u.derivedPosition();
                    const unit = {
                        "y" : pos.x,
                        "x" : pos.x,
                        "type" : u.type,
                        health: u.health,
                        fortified: u.fortified,
                        submerged: u.submerged,
                        fuel: u.fuel
                    }
                    if(u.nestedUnits) unit.nestedUnits = u.nestedUnits.map(nu=>{return {
                        "y" : pos.x,
                        "x" : pos.x,
                        "type" : nu.type,
                        health: nu.health
                    }});

                    return u;
                }),
                "status" : "accepted",
                "position" : player.position
            }
        }),
        map: {
            dimensions: map.dimensions,
            world: map.data.map(row=>row.map(c=>c.type).join(''))
        },
        status: 'active'
    }
    return raw;
}