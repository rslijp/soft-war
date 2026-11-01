import {DEV_GAME_CODE} from "./DevGameLoader";
import {MessageBus} from "softwar-shared";
import {apiFetch} from "./Api";
import {remoteGame} from "./GameConnection";
import {serializeGameState} from "softwar-shared/services/save-game.mjs";

export function loadGameState(code) {
    // the game runs on the server (and is saved there); this screen connects to it
    MessageBus.clear();
    return remoteGame(code).then(({gameView}) => {
        MessageBus.send("update-game-state", gameView);
        return gameView;
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
    // the dev game only lives in the browser
    if(gameState.code === DEV_GAME_CODE) return Promise.resolve();
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