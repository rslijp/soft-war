import {decorateMap, generateMap, inflateMap} from "softwar-shared";
import {apiFetch} from "./Api";

export function demoLoader() {
    // return apiFetch("GET",`/api/app-state/game/AMAZING`);
    return apiFetch("GET",`/api/map-generator/REGULAR/64x32`).then(r => {
        return {
            map: decorateMap(inflateMap(r))
        };
    });
}

export function localDemoLoader() {
    return {
        map: decorateMap(inflateMap(generateMap('REGULAR', 32,32)))
    };
}