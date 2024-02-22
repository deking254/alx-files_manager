const db = require('../utils/db');
const sha = require('sha1');
class UsersController {
  constructor (){
  this.postNew = (request, response, email, password) =>{
    if (!email){
      response.status(400).send({"error":"Missing email"})
    }
    if (!password) {
      response.status(400).send({"error":"Missing password"});
    }
    let user = db.database.collections('users').find({email: email}).toArray().length;
    if (!user){
      let collection = db.database.collections('users');
      collection.insertOne({email: sha(password)}, (err, result)=>{
        if (!err){
          response.status(201).send(result);
	}
      })
    }
  }
  }

}
const userCont = new UsersController();
module.exports = userCont;
