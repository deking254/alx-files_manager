const redisClient = require('../utils/redis');
const mongoClient = require('../utils/db');
let userCount;
let fileCount;
class AppController{
  constructor(){
    this.getStats = async (res)=>{
      userCount = await mongoClient.nbUsers();
      fileCount = await mongoClient.nbFiles();
      let result = { "users": userCount, "files": fileCount };
      res.status(200).send(result);
    }
    this.getStatus = (res) =>{
      let result = { "redis": redisClient.isAlive(), "db": mongoClient.isAlive() };
      res.status(200).send(result);	    
    }
  }
}
const appContrllr = new AppController()
module.exports = appContrllr;
