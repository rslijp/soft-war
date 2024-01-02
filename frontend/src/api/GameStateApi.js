import {decorateMap, deserializeGameState, inflateMap} from "softwar-shared";
import {apiFetch} from "./Api";

export function loadGameState(code) {
    return apiFetch("GET",`/api/app-state/game/${code}`).then(r => {
        const gameState = deserializeGameState(r.players, r.map);
        decorateMap(gameState.world());
        console.log(gameState.world());
        return {
            ...r,
            map: decorateMap(inflateMap(r.map, r.players), r.players)
        };
    });
}

export function loadYourGames() {
    return apiFetch("GET",`/api/app-state/your-games`).then(r => {
        return r;
    });
}

export function newGame(type, dimensions, name) {
    return apiFetch("POST",`/api/app-state/new-game`, {
        type, dimensions, name
    });
}

export function surrenderGame(code) {
    return apiFetch("DELETE",`/api/app-state/game/${code}`).then(r => {
        return r;
    });
}
