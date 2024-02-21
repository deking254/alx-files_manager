const redisClient = require('../utils/redis');
const mongoClient = require('../utils/db');
class AppController{
  getStatus(app){
      app.get('/status', (req, res)=>{
	let result = JSON.stringify({ "redis": redisClient.isAlive(), "db": mongoClient.isAlive() });
        res.end(result);
      })
  }
  getStats(app){
      app.get('/stats', (req, res)=>{
	let users = mongoClient.nbUsers();
	let files = mongoClient.nbFiles();
	let result = JSON.stringify({ "users": users, "files": files });
        res.end(result);
      })
    }
  }
const appController = new AppController();
module.exports = appController;
