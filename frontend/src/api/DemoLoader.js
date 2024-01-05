import {decorateMap, deserializeGameState, generateMap} from "softwar-shared";

export function localDemoLoader() {
    const rawMap = generateMap('REGULAR', 32,32);
    const gameState = deserializeGameState({},[], rawMap);
    decorateMap(gameState.world());
    return gameState;
}