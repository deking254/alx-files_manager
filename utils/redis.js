const redis = require('redis');
class RedisClient {
  constructor(){
    this.client = redis.createClient();
    this.client.on('error', (error)=>{
      console.log(error);
    })
  }
  isAlive(){
    if (this.client){
      return true;
    } else{
      return false;
    }
  }
  async get(key){
    if (this.isAlive()){
      let result = await new Promise((resolve, reject)=>{
        this.client.get(key, (error, response)=>{
          if (!error){
            resolve(response);
	  }
	});
      })
      return result;
    }
  }
  async set( key, value, duration){
    this.client.set(key, value, 'EX', duration); 
  }
  async del(key){
   if (this.isAlive()){
     this.client.remove(key);
   } 
  }
  
}
const redisClient = new RedisClient();
module.exports = redisClient;
