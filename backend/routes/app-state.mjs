import {generateMap, generatePlayerList} from "softwar-shared/services/map-service.mjs";
import connection from '../connections.mjs';
import express from 'express';
import {generateCode} from "softwar-shared/services/random-code-service.mjs"
import {winnerEmail, lostEmail, pendingMail, allAccepted, oneDeclined} from "../mailer.mjs";
import {games} from "../games.mjs";
const router = express.Router();

async function appStates(){
    return connection.collection("app-state");
}

async function finishedGameStates(){
    return connection.collection("finished-app-states");
}

function isValidCode(code){
    return !!code && code.length <= 16;
}

async function findGame(code){
    let collection = await appStates();
    return collection.findOne({code});
}

function findPlayer(gameState, user){
    return gameState.players.find(p => p.id === user.email);
}

async function saveNewGame(state){
  let collection = await appStates();
  return collection.insertOne(state);
}

async function saveFinishedGame(state){
    let collection = await finishedGameStates();
    return collection.insertOne(state);
}

router.get('/your-games', async function(req, res, next) {
  const user = req.session.passport.user._json;
  let collection = await appStates();
  let results = await collection.find({ "players" : { $elemMatch : { "id" : user.email } } })
      .limit(10)
      .toArray();
  const projection = results.map(r=> {
        return {
          name: r.name,
          code: r.code,
          status: r.status,
          at: r.at,
          turn: r.turn,
          currentPlayer: r.currentPlayer,
          waitingOnYou: r.players[r.currentPlayer].id === user.email,
          players: r.players.map(p=>{return {name: p.name, type: p.type, status: p.status, isYou: p.id === user.email}})
        }
      });
  res.send(projection).status(200);
});

router.get('/game/:code', async function(req, res, next) {
  const user = req.session.passport.user._json;
  if(!isValidCode(req.params.code)) {
    console.log("Code to long", req.params.code);
    res.sendStatus(412);
    return;
  }
  let result = await findGame(req.params.code);
  if(!findPlayer(result, user)){
      console.log("Not your game");
      res.sendStatus(403);
      return;
  }
  res.send(result).status(200);
});

router.get('/user', async function(req, res){
    const user = {...req.session.passport.user._json};
    let collection = await appStates();
    let results = await collection.find({ "players" : { $elemMatch : { "id" : user.email } } })
        .limit(10)
        .toArray();
    let pendingActions = 0;
    results.forEach(r=>{
        if(r.status==='active' && r.players[r.currentPlayer].id === user.email) pendingActions++;
        else if(r.players.some(p=>p.status==='pending'&&p.id === user.email)) pendingActions++;
    });
    user.pendingActions=pendingActions;
    res.send(user).status(200);
});

async function  retrieveExistingGame(code, user){
    if (!code) {
        throw {httpCode :412, message: "No code provided"};
    }
    if (code.length > 16) {
        throw {httpCode :412, message: "Code to long "+code};
    }
    let retrievedGameState = await findGame(code);
    if (!retrievedGameState) {
        throw {httpCode :404, message: "No such game "+code};
    }

    const player = findPlayer(retrievedGameState, user);
    if (!player) {
        throw {httpCode :403, message: "You don't participate in game "+code};
    }
    return retrievedGameState;
}

router.post('/save-game', async function(req, res, next) {
    const user = req.session.passport.user._json;
    const gameState = req.body;
    try {
        await retrieveExistingGame(gameState.code, user);
        let collection = await appStates();
        await collection.replaceOne({code: gameState.code}, gameState, {upsert: true});
        // always answer: a request left open holds one of the browser's few connections to
        // this server, and after a handful of saves the next ones never got through
        res.send({saved: true});
    } catch(e){
        console.error("ERROR", e.message || e);
        res.status(e.httpCode || 500).send({error: e.message || "Save failed"});
    }
});

router.post('/new-game', async function(req, res, next) {
  const {type, dimensions, name, players} = req.body;
  const user = req.session.passport.user._json;
    let collection = await appStates();
    if(await collection.count({player: { id: user.email}})>10) {
    console.log("MAX OPEN GAMES");
    res.sendStatus(412);
    return;
  }

  if(!name ||  !type || !dimensions) {
    console.log("MISSING PARAMS");
    res.sendStatus(412);
    return;
  }
  if(name.length>64){
      res.sendStatus(412);
      return;
  }
  const [width, height] = dimensions.split('x');
  const world = generateMap(type, width, height)
  if(!world) {
    console.log("MAP FAILED");
    res.sendStatus(412);
    return;
  }

  const allPlayers = generatePlayerList(user,players, world);

  const state = {
      code: generateCode(12),
      name: name,
      at: Date.now(),
      turn: 1,
      currentPlayer: 0,
      players: allPlayers,
      map: world,
      status: allPlayers.every(p=>p.status==='accepted')?'active':'pending'
  }
  saveNewGame(state).then(()=>res.send({code: state.code, status: state.status}).status(200));
  if(state.status==='pending'){
      pendingMail(user.email, state.name, allPlayers.filter(p=>p.status==='pending').map(p=>p.id));
  }
})

async function retrieve(req, res, onLoad){
    const user = req.session.passport.user._json;
    if (!isValidCode(req.params.code)) {
        console.log("Code to long", req.params.code);
        res.sendStatus(412);
        return;
    }
    let gameState = await findGame(req.params.code);
    const player = findPlayer(gameState, user);
    if (!player) {
        console.log("Not your game");
        res.sendStatus(403);
        return;
    }
    onLoad(gameState, player);
}

router.delete('/pending-game/:code', async function(req, res, next) {
    await games.close(req.params.code);
    await retrieve(req, res, async (state, player)=>{
        if(player.status !== 'pending'){
            console.log("Already accepted");
            res.sendStatus(412);
            return;
        }
        player.status='declined';
        state.status = 'declined';
        let collection = await appStates();
        const result = await collection.deleteOne({code: req.params.code});
        if (result.deletedCount === 1) {
            state._id = undefined;
            await saveFinishedGame(state);
        } else {
            console.log("No documents matched the query. Deleted 0 documents.");
        }
        res.send({status: state.status}).status(200);
        oneDeclined(state.name, state.players.filter(p=>p.type==='Human').map(p=>p.id));
    });
});


router.put('/pending-game/:code', async function(req, res, next) {
    await games.close(req.params.code);
    await retrieve(req, res, async (state, player)=>{
        if(player.status !== 'pending'){
            console.log("Already accepted");
            res.sendStatus(412);
            return;
        }
        player.status='accepted';
        state.status = state.players.every(p=>p.status==='accepted')?'active':'pending';
        let collection = await appStates();
        collection.replaceOne({code: req.params.code}, state, {upsert: false});
        res.send({status: state.status}).status(200);
        if(state.status === 'active'){
            allAccepted(state.name, state.players.filter(p=>p.type==='Human').map(p=>p.id));
        }
    });
});

// Surrender: you are out. The game goes on for the others, or ends when only one player, or no human, is left.
router.delete('/game/:code', async function(req, res, next) {
    const user = req.session.passport.user._json;
    try {
        // a running game is saved and stopped first; its other screens reconnect to the new state
        await games.close(req.params.code);
        const gameState = await retrieveExistingGame(req.params.code, user);
        findPlayer(gameState, user).status = 'surrendered';

        const playing = gameState.players.filter(p => p.status === 'accepted');
        const humansPlaying = playing.filter(p => p.type === 'Human');
        const status = playing.length > 1 && humansPlaying.length > 0 ? 'active' : 'finished';
        gameState.status = status;

        let collection = await appStates();
        if (status === 'finished') {
            const winner = playing.length === 1 ? playing[0] : null;
            if (winner && winner.type === 'Human') winnerEmail(winner.id, gameState.name);
            const losers = gameState.players.filter(p => p.type === 'Human' && p !== winner).map(p => p.id);
            if (losers.length > 0) lostEmail(losers, gameState.name);
            const result = await collection.deleteOne({code: req.params.code});
            if (result.deletedCount === 1) {
                gameState._id = undefined;
                await saveFinishedGame(gameState);
            }
        } else {
            await collection.replaceOne({code: req.params.code}, gameState, {upsert: true});
        }
        res.send({status: status});
    } catch (e){
        console.error(e.message);
        res.sendStatus(e.httpCode || 500);
    }
});


export default router;