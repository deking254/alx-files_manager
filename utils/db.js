const MongoClient = require('mongodb').MongoClient;
const env = require('process').env;
class DBClient {
  constructor() {
    this.clientObject = null;
    if (env.DB_DATABASE){
      this.databaseName = env.DB_DATABASE;
    } else {
      this.databaseName = 'files_manager';
    }
    if (env.DB_PORT && env.DB_HOST && env.DB_DATABASE){ 
      this.url = `mongodb://${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}`
    }else{
      this.url = `mongodb://localhost:27017`;
    }
    this.client = new MongoClient(this.url, { useUnifiedTopology: true })
    this.client.connect((error, client)=>{
      if (client){
        this.clientObject = client;
      }
    });
    }
  isAlive() {
    if (this.clientObject){
      return true;
    }
    return false
   }
  async nbUsers (){
    if (this.isAlive()){ 
    }
  }
  async nbFiles () {

  }
}
const dbClient = new DBClient();
module.exports = dbClient;
