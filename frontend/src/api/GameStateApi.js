import {apiFetch} from "./Api";
import {inflateMap} from "./WorldMap";

export function loadGameState(code) {
    return apiFetch("GET",`/api/app-state/game/${code}`).then(r => {
        return {
            ...r,
            map: inflateMap(r.map)
        };
    });
}

export function loadYourGames() {
    return apiFetch("GET",`/api/app-state/your-games`).then(r => {
        console.log(r);
        return r;
    });
}

export function newGame(type, dimensions, name) {
    return apiFetch("PUT",`/api/app-state/new-game/${type}/${dimensions}/${name}`);
}

export function surrenderGame(code) {
    return apiFetch("DELETE",`/api/app-state/game/${code}`).then(r => {
        return r;
    });
}
