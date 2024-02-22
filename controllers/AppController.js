const redisClient = require('../utils/redis');
const mongoClient = require('../utils/db');
const router = require('express').Router();
let userCount;
let fileCount;

async function getStats () {
  userCount = await mongoClient.nbUsers();
  fileCount = await mongoClient.nbFiles();
}
getStats();
router.get('/status', (req, res)=>{
  res.statusCode = 200;
  let result = JSON.stringify({ "redis": redisClient.isAlive(), "db": mongoClient.isAlive() });
  res.send(result);
})

router.get('/stats', (req, res)=>{
  res.statusCode = 200;
  let result = JSON.stringify({ "users": userCount, "files": fileCount });
  return res.send(result);
})
module.exports = router;
