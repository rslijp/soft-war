import {MessageBus, decorateMap, deserializeGameState, generateMap} from "softwar-shared";

export function localDemoLoader() {
    MessageBus.clear();
    const rawMap = generateMap('REGULAR', 32,32);
    const gameState = deserializeGameState({map: rawMap, players: []});
    decorateMap(gameState.world());
    return gameState;
}