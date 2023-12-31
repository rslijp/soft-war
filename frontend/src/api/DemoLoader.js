import {apiFetch} from "./Api";
import {inflateMap} from "./WorldMap";

export function demoLoader() {
    // return apiFetch("GET",`/api/app-state/game/AMAZING`);
    return apiFetch("GET",`/api/map-generator/REGULAR/64x32`).then(r => {
        return {
            map: inflateMap(r)
        };
    });
}