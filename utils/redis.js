const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (error) => {
      console.log(error);
    });
  }

  isAlive() {
    if (this.client.exists(1)) {
      return true;
    }
    return false;
  }

  async get(key) {
    let result;
    if (this.isAlive()) {
      result = await new Promise((resolve) => {
        this.client.get(key, (error, response) => {
          if (!error) {
            resolve(response);
          }
        });
      });
    }
    return result;
  }

  async set(key, value, duration) {
    this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    if (this.isAlive()) {
      this.client.delete(key);
    }
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
