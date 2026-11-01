import {MessageBus, decorateMap, deserializeGameState, generateMap} from "softwar-shared";
import {generatePlayerList} from "softwar-shared/services/map-service.mjs";

export const DEV_GAME_CODE = "dev-game";

// A game that lives only in the browser, for trying out the game page without the backend,
// a login or MongoDB. Only routed in development builds (npm run watch).
//   #/dev-game?size=64x64&type=REGULAR&ai=1
export function devGameLoader({request}) {
    const params = new URL(request.url).searchParams;
    const [width, height] = (params.get("size") || "64x64").split("x").map(Number);
    const opponents = Math.min(3, Math.max(1, Number(params.get("ai") || 1)));
    const user = {email: "dev@localhost", name: "Developer"};
    let world, players;
    // a small map can leave a quarter without a start city; then just try another map
    for(let attempt = 0; !players; attempt++) {
        world = generateMap(params.get("type") || "REGULAR", width, height);
        try {
            players = generatePlayerList(user, Array(opponents).fill(""), world);
        } catch(e) {
            if(attempt === 20) throw e;
        }
    }
    MessageBus.clear();
    const gameState = deserializeGameState({
        code: DEV_GAME_CODE,
        name: "Dev game",
        turn: 1,
        currentPlayer: 0,
        players: players,
        map: world
    });
    decorateMap(gameState.world());
    MessageBus.send("update-game-state", gameState);
    return gameState;
}
