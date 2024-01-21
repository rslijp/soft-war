import {MessageBus, decorateMap, deserializeGameState} from "softwar-shared";
import {apiFetch} from "./Api";
import {serializeGameState} from "softwar-shared/services/save-game.mjs";

export function loadGameState(code) {
    return apiFetch("GET",`/api/app-state/game/${code}`).then(r => {
        MessageBus.clear();
        const gameState = deserializeGameState(r);
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

export function saveGame(gameState) {
    return apiFetch("POST",`/api/app-state/save-game`, serializeGameState(gameState));
}

export function surrenderGame(code) {
    return apiFetch("DELETE",`/api/app-state/game/${code}`).then(r => {
        return r;
    });
}

export function acceptGame(code) {
    return apiFetch("PUT",`/api/app-state/pending-game/${code}`).then(r => {
        return r;
    });
}

export function declineGame(code) {
    return apiFetch("DELETE",`/api/app-state/pending-game/${code}`).then(r => {
        return r;
    });
}