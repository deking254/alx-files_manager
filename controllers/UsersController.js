const db = require('../utils/db');
const sha = require('sha1');
class UsersController {
  constructor (){
  this.postNew = async (request, response, email, password) =>{
    if (!email){
      response.status(400).send({"error":"Missing email"})
    }
    if (!password) {
      response.status(400).send({"error":"Missing password"});
    }
    let user = await db.database.collection('users').find({email: email}).count();
    if (!user){
      let collection = db.database.collection('users');
      collection.insertOne({email: email, password: sha(password)}, (err, result)=>{
        if (!err){
	  let id = result.ops[0]._id;
	  let email = result.ops[0].email;
          response.status(201).send({"id": id, "email": email});
	}
      })
    } else {
      response.status(400).send({"error":"Already exist"});
    }
  }
  }

}
const userCont = new UsersController();
module.exports = userCont;
