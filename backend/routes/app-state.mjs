import connection from '../connections.mjs';
import express from 'express';
const router = express.Router();


async function findOneListingByName(client, code) {
  console.log(`Looking for an app state in the collection with the code '${code}':`);
  const result = await   connection.collection("app-state").findOne({code: code});
  console.log("xxx",result);
  return result;
  // const result = await client.db("softwar").collection("app-state").findOne({ code: code });
  // console.log("xxx",result);
  // if (result) {
  //   console.log(`Found an app state in the collection with the code '${code}':`);
  //   console.log(result);
  //   return result;
  // } else {
  //   console.log(`No app state found with the code '${success}'`);
  // }
}

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


router.get('/:code', async function(req, res, next) {
  console.log(">",req.params.code);
  if(!req.params.code || req.params.code.length>16) {
    res.status("412");
  }
  let collection = await connection.collection("app-state");
  let result = await collection.findOne({code: req.params.code});
  res.send(result).status(200);
});

export default router;