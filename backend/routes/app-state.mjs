import connection from '../connections.mjs';
import express from 'express';
const router = express.Router();

async function appStates(){
    return connection.collection("app-state");
}

/* GET users listing. */
router.get('/all', async function(req, res, next) {
  let collection = await appStates();
  let results = await collection.find({})
      .limit(50)
      .toArray();
  res.send(results).status(200);
});


router.get('/game/:code', async function(req, res, next) {
  console.log(">",req.params.code);
  if(!req.params.code || req.params.code.length>16) {
    res.status("412");
    return;
  }
  let collection = await connection.collection("app-state");
  let result = await collection.findOne({code: req.params.code});
  res.send(result).status(200);
});

router.get('/user', function(req, res){
  res.send(req.session.passport.user._json).status(200);
});

export default router;