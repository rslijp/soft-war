import {decorateMap, deserializeGameState} from "softwar-shared";
import {apiFetch} from "./Api";

export function loadGameState(code) {
    return apiFetch("GET",`/api/app-state/game/${code}`).then(r => {
        const gameState = deserializeGameState(r, r.players, r.map);
        decorateMap(gameState.world());
        return gameState;
    });
}

export function loadYourGames() {
    return apiFetch("GET",`/api/app-state/your-games`).then(r => {
        return r;
    });
}

export function newGame(type, dimensions, name, players) {
    return apiFetch("POST",`/api/app-state/new-game`, {
        type, dimensions, name, players
    });
}

export function surrenderGame(code) {
    return apiFetch("DELETE",`/api/app-state/game/${code}`).then(r => {
        return r;
    });
}
