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
      this.url = 'mongodb://localhost:27017';
    }
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    this.client.connect((error, client) => {
      if (client) {
        this.clientObject = client;
        this.database = this.clientObject.db(this.databaseName);
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
      const collection = this.database.collections.files;
      collection.find().toArray((err, docs) => {
        value = docs.length;
      });
    }
    return value;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
