const redisClient = require('../utils/redis');
const mongoClient = require('../utils/db');
const router = require('express').Router();
let userCount;
let fileCount;

async function getStats () {
  userCount = await mongoClient.nbUsers();
  fileCount = await mongoClient.nbFiles();
  router.get('/stats', (req, res)=>{
    res.statusCode = 200;
    let result = { "users": userCount, "files": fileCount };
    res.status(200).send(result);
  })
}
getStats();
router.get('/status', (req, res)=>{
  res.statusCode = 200;
  let result = { "redis": redisClient.isAlive(), "db": mongoClient.isAlive() };
  res.status(200).send(result);
})
module.exports = router;
