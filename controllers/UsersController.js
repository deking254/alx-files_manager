const db = require('../utils/db');
const sha = require('sha1');
const cache = require('../utils/redis');
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
  this.getMe = async (req, res)=>{
    let token = req.header('X-Token');
    if (token){
      let userId = await cache.get(token);
      if (userId){
        db.database.collection('users').find({}).toArray((err, result)=>{
	  let exists = false;
          for (let i = 0; i < result.length; i++){
            if (result[i]._id.toString() === userId){
	      exists = true;
              let id = result[i]._id.toString();
	      let email = result[i].email;
	      res.status(200).send({"id": id, "email": email})
	    }
	  }
          if (!exists){
            res.status(401).send({"error":"Unauthorized"});
	  }
	})
      } else {
        res.status(401).send({"error":"Unauthorized"});
      }
    }
  }
  }

}
const userCont = new UsersController();
module.exports = userCont;
