import {decorateMap, deserializeGameState, generateMap, MessageBus} from "softwar-shared";

export function localDemoLoader() {
    MessageBus.clear();
    const rawMap = generateMap('REGULAR', 32,32);
    const gameState = deserializeGameState({},[], rawMap);
    decorateMap(gameState.world());
    return gameState;
}