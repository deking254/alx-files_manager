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
      this.url = `mongodb://localhost:27017/file_manager`;
    }
    this.client = new MongoClient(this.url);
    }
  isAlive() {
    let statu = false;
    this.client.connect((error, client)=>{
      if (error){
        return false
      } else {
        statu = true
      }
    })
	  return statu;
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
