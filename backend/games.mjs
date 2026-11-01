// The one game server of this backend: games run here and are stored in the app-state collection.
import connection from "./connections.mjs";
import {gameServer} from "./game-server.mjs";
import {yourTurnMail} from "./mailer.mjs";

const appStates = () => connection.collection("app-state");

export const games = gameServer({
    findGame: (code) => appStates().findOne({code}),
    saveGame: (code, state) => appStates().replaceOne({code}, state, {upsert: true}),
    // a human whose turn starts while they don't have the game open gets an email
    onTurnEnded: (game, running) => {
        const player = game.currentPlayer();
        if (player.type === "Human" && !running.isWatching(player.index)) {
            yourTurnMail(player.id, game.name, game.code);
        }
    }
});
