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
        const units = [];
        var load = rawunit.nestedUnits || [];
        load.forEach((rawload) => {
            var load = new unit(rawload.type);
            if(rawload.health) load.health=rawload.health;
            if (!carryingUnit.canLoad(load, true)) {
                throw "Can't load unit";
            }
            carryingUnit.internalLoad(load);
            units.push(load);
        });
        return units;
    },
    loadUnits: function(rawunits) {
        let units = [];
        rawunits.forEach((rawunit) => {
            const mainUnit = new unit(rawunit.type, {y: rawunit.y, x: rawunit.x});
            if(rawunit.health!==undefined) mainUnit.health=rawunit.health;
            if(rawunit.fortified!==undefined) mainUnit.fortified=rawunit.fortified;
            if(rawunit.submerged!==undefined) mainUnit.submerged=rawunit.submerged;
            if(rawunit.fuel!==undefined) mainUnit.fuel=rawunit.fuel;
            if(rawunit.order!==undefined) mainUnit.order=rawunit.order;
            units=units.concat(this.loadNestedUnits(rawunit, mainUnit));
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
        if(rawPlayer.discoveredTiles) player.fogOfWar.discoveredTiles = rawPlayer.discoveredTiles;
        if(rawPlayer.messages) player.messages=rawPlayer.messages;
        if(rawPlayer.embarking) player.messages=rawPlayer.embarking;
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
        currentPlayer: game.currentPlayerIndex,
        players: game.players.map(player=>{
            const units = [];
            const cities = [];
            player.units.filter(u=>u.clazz==='city').forEach(c=>{
               cities.push(c);
                (c.nestedUnits||[]).forEach(u=>units.push(u))
            });
            player.units.filter(u=>u.clazz==='unit'&&!u.inside).forEach(u=>{
                units.push(u)
            });
            return {
                "id" : player.id,
                "name" : player.name,
                "type" : player.type,
                "fogOfWar": player.fogOfWar.data,
                "discoveredTiles": player.fogOfWar.discoveredTiles,
                "messages": player.messages,
                "cities" : cities.map(u=>{
                    const pos = u.derivedPosition();
                    return {
                        "y" : pos.y,
                        "x" : pos.x,
                        "producingType" : u.producingType,
                        "production": u.production||0
                    }
                }),
                "embarking": player.embarking?player.embarking:undefined,
                "units": units.map(u=>{
                    const pos = u.derivedPosition();
                    const unit = {
                        "y" : pos.y,
                        "x" : pos.x,
                        "type" : u.type,
                        health: u.health,
                        fortified: u.fortified,
                        submerged: u.submerged,
                        fuel: u.fuel
                    }
                    if(u.order){
                        unit.order={
                            action: u.order.action,
                            queue: u.order.queue,
                            reverse: u.order.reverse,
                            direction: u.order.direction
                        };
                    }
                    if(u.nestedUnits) unit.nestedUnits = u.nestedUnits.map(nu=>{return {
                        "y" : pos.x,
                        "x" : pos.x,
                        "type" : nu.type,
                        health: nu.health
                    }});

                    return unit;
                }),
                "status" : "accepted",
                "position" : player.position
            }
        }),
        map: {
            dimensions: map.dimensions,
            world: map.data.map(row=>row.map(c=>c.type).join('')),
            cities: map.cities.map(c=>[c.position.y, c.position.x])
        },
        status: 'active'
    }
    return raw;
}