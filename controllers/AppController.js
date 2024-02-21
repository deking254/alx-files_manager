const redisClient = require('../utils/redis');
const mongoClient = require('../utils/db');
class AppController{
  constructor(){
    this.redis = 1;
    this.mongodb = 1; 
    if (redisClient.isAlive()){
      this.redis = true;
    }
    if (mongoClient.isAlive()){
      this.mongodb = true;
    }
  }
  getStatus(app){
    if (this.redis && this.mongodb){
      app.get('/status', (req, res)=>{
	let result = JSON.stringify({ "redis": true, "db": true });
        res.end(result);
      })
    }
  }
  getStats(app){
    if (this.redis && this.mongodb){
      app.get('/stats', (req, res)=>{
	let users = mongoClient.nbUsers();
	let files = mongoClient.nbFiles();
	let result = JSON.stringify({ "users": users, "files": files });
        res.end(result);
      })
    }
  }
}
const appController = new AppController();
module.exports = appController;
