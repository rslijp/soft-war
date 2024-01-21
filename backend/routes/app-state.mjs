import {generateMap, generatePlayerList} from "softwar-shared/services/map-service.mjs";
import connection from '../connections.mjs';
import express from 'express';
import {generateCode} from "softwar-shared/services/random-code-service.mjs"
import {winnerEmail, lostEmail, pendingMail, allAccepted, oneDeclined} from "../mailer.mjs";
const router = express.Router();

async function appStates(){
    return connection.collection("app-state");
}

async function finishedGameStates(){
    return connection.collection("finished-app-states");
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
  console.log("Listing game for",user.email);
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
  console.log("Retrieving game",req.params.code);
  if(!req.params.code || req.params.code.length>16) {
    console.log("Code to long", req.params.code);
    res.status("412");
    return;
  }
  let collection = await appStates();//connection.collection("app-state");
  let result = await collection.findOne({code: req.params.code});
  if(!result.players.some(p=>p.id===user.email)){
      console.log("Not your game");
      res.status("403");
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
    console.log("Retrieving game", code);
    if (!code) {
        throw {httpCode :412, message: "No code provided"};
    }
    if (code.length > 16) {
        throw {httpCode :412, message: "Code to long "+code};
    }
    let collection = await appStates();//connection.collection("app-state");
    let retrievedGameState = await collection.findOne({code});
    if (!retrievedGameState) {
        throw {httpCode :404, message: "No such game "+code};
    }

    const player = retrievedGameState.players.find(p => p.id === user.email);
    if (!player) {
        throw {httpCode :403, message: "You don't participate in game "+code};
    }
    return retrievedGameState;
}

router.post('/save-game', async function(req, res, next) {
    const user = req.session.passport.user._json;
    const gameState = req.body;
    try {
        console.log("Checking")
        let retrievedGameState = await retrieveExistingGame(gameState.code, user);
        console.log("Saving")
        let collection = await appStates();
        return collection.replaceOne({code: gameState.code}, gameState, {upsert: true});
    } catch(e){
        console.log(e);
        console.error("ERROR",e.messages);
        res.status(e.httpCode);
    }
});

router.post('/new-game', async function(req, res, next) {
  const {type, dimensions, name, players} = req.body;
  const user = req.session.passport.user._json;
    let collection = await appStates();
    if(await collection.count({player: { id: user.email}})>10) {
    console.log("MAX OPEN GAMES");
    res.status("412");
    return;
  }

  if(!name ||  !type || !dimensions) {
    console.log("MISSING PARAMS");
    res.status("412");
    return;
  }
  if(name.length>64){
      res.status("412");
      return;
  }
  const [width, height] = dimensions.split('x');
  const world = generateMap(type, width, height)
  if(!world) {
    console.log("MAP FAILED");
    res.status("412");
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
    console.log("Retrieving game", req.params.code);
    if (!req.params.code || req.params.code.length > 16) {
        console.log("Code to long", req.params.code);
        res.status("412");
        return;
    }
    let collection = await appStates();//connection.collection("app-state");
    let gameState = await collection.findOne({code: req.params.code});
    const player = gameState.players.find(p => p.id === user.email);
    if (!player) {
        console.log("Not your game");
        res.status("403");
        return;
    }
    onLoad(gameState, player);
}

router.delete('/pending-game/:code', async function(req, res, next) {
    await retrieve(req, res, async (state, player)=>{
        if(player.status !== 'pending'){
            console.log("Already accepted");
            res.status("412");
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
    await retrieve(req, res, async (state, player)=>{
        if(player.status !== 'pending'){
            console.log("Already accepted");
            res.status("412");
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

router.delete('/game/:code', async function(req, res, next) {
    const user = req.session.passport.user._json;
    console.log("Deleting game", req.params.code);
    try {
        const gameState = await retrieveExistingGame(req.params.code, user);

        const activePlayers = gameState.players.filter(p => p.status === 'active');
        const lostPlayers = gameState.players.filter(p => p.status !== 'active');
        const status = activePlayers.length > 1 ? 'active' : 'finished';
        if (activePlayers.length === 1) {
            if (activePlayers[0].type === 'Human') winnerEmail(activePlayers[0].id, gameState.name);
            const lostHumanPlayers = lostPlayers.filter(p => p.type === 'Human');
            if (lostHumanPlayers.length > 0) lostEmail(lostHumanPlayers.map(p => p.id), gameState.name);
        }
        if (activePlayers.length === 0) {
            const lostHumanPlayers = lostPlayers.filter(p => p.type === 'Human');
            if (lostHumanPlayers.length > 0) lostEmail(lostHumanPlayers.map(p => p.id), gameState.name);
        }

        if (status === 'finished') {
            const result = await collection.deleteOne({code: req.params.code});
            if (result.deletedCount === 1) {
                gameState._id = undefined;
                await saveFinishedGame(gameState);
            } else {
                console.log("No documents matched the query. Deleted 0 documents.");
            }
        } else {
            return collection.replaceOne({code: req.params.code}, gameState, {upsert: true});
        }
        res.send({status: status}).status(200);
    } catch (e){
        console.error(e.message);
        res.status(e.httpCode);
    }
});


export default router;