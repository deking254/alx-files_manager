const { MongoClient } = require('mongodb');
const { env } = require('process');

class DBClient {
  constructor() {
    this.clientObject = null;
    this.database = null;
    if (env.DB_DATABASE) {
      this.databaseName = env.DB_DATABASE;
    } else {
      this.databaseName = 'files_manager';
    }
    if (env.DB_PORT && env.DB_HOST && env.DB_DATABASE) {
      this.url = `mongodb://${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}`;
    } else {
      this.url = 'mongodb://localhost:27017/files_manager';
    }
    let client = new MongoClient(this.url, { useUnifiedTopology: true });
    client.connect(async (error, clint) => {
      if (clint) {
	console.log('Connected to the server');
        this.clientObject = clint;
        this.database = this.clientObject.db(this.databaseName);
      }
      if (error){
        console.log('Error Connecting to the server');
      }
      
    }); 
  }


  isAlive() {
    if (this.clientObject) {
      return true;
    }
    return false;
  }

  async nbUsers() {
    let value = 0;
    if (this.isAlive()) {
      const users = this.database.collection('users');
      value = await users.countDocuments();
    }
    return value;
  }

  async nbFiles() {
    let value = 0;
    if (this.isAlive()) {
      const files = this.database.collection('files');
      value = await files.countDocuments();
    }
    return value;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
