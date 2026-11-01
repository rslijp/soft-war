// The one game server of this backend: games run here and are stored in the app-state collection.
import connection from "./connections.mjs";
import {gameServer} from "./game-server.mjs";

const appStates = () => connection.collection("app-state");

export const games = gameServer({
    findGame: (code) => appStates().findOne({code}),
    saveGame: (code, state) => appStates().replaceOne({code}, state, {upsert: true})
});
