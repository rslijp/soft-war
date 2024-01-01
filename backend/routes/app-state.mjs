import connection from '../connections.mjs';
import express from 'express';
import {generateMap} from "../services/map-service.mjs"
import {generateCode} from "../services/random-code-service.mjs"
const router = express.Router();

async function appStates(){
    return connection.collection("app-state");
}

async function finishedGameStates(){
    return connection.collection("finished-app-state");
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
          at: r.at,
          turn: r.turn,
          waitingOnYou: r.players[r.currentPlayer-1].id === user.email,
          players: r.players.map(p=>{return {name: p.name, type: p.type}})
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

router.get('/user', function(req, res){
  res.send(req.session.passport.user._json).status(200);
});

router.put('/new-game/:type/:dimensions/:name', async function(req, res, next) {
  const user = req.session.passport.user._json;
    let collection = await appStates();
    if(await collection.count({player: { id: user.email}})>10) {
    console.log("MAX OPEN GAMES");
    res.status("412");
    return;
  }

  if(!req.params.name ||  !req.params.type || !req.params.dimensions) {
    console.log("MISSING PARAMS");
    res.status("412");
    return;
  }
  if(req.params.name.length>64){
      res.status("412");
      return;
  }
  const dimensions = req.params.dimensions.split('x');
  const world = generateMap(req.params.type, dimensions[0], dimensions[1])
  if(!world) {
    console.log("MAP FAILED");
    res.status("412");
    return;
  }
  const state = {
      code: generateCode(12),
      name: req.params.name,
      at: Date.now(),
      turn: 1,
      currentPlayer: 1,
      players: [{
        id: user.email,
        name : user.name,
        type: "Human",
        color: "Cyan",
        units: [],
        accepted: true
      }],
      map: world
  }
  saveNewGame(state).then(()=>res.send({code: state.code}).status(200));
})

router.delete('/game/:code', async function(req, res, next) {
    const user = req.session.passport.user._json;
    console.log("Retrieving game",req.params.code);
    if(!req.params.code || req.params.code.length>16) {
        console.log("Code to long", req.params.code);
        res.status("412");
        return;
    }
    let collection = await appStates();//connection.collection("app-state");
    let gameState = await collection.findOne({code: req.params.code});

    const player = gameState.players.find(p=>p.id===user.email);
    if(!player){
        console.log("Not your game");
        res.status("403");
        return;
    }

    player.status="surrender";
    const result = await collection.deleteOne({code: req.params.code});
    if (result.deletedCount === 1) {
        await saveFinishedGame(gameState)
    } else {
        console.log("No documents matched the query. Deleted 0 documents.");
    }
    res.send(result).status(200);
});


export default router;