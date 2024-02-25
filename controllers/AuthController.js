const authCtrl = require('../controllers/AuthController');
const basicAuth = require('base64-js');
const database = require('../utils/db');
const cache = require('../utils/redis');
const sha = require('sha1');
const uuid = require('uuid');
class AuthController{
  constructor(){
    this.getConnect = (req, res)=>{
    let authCode = req.header("Authorization").split(' ')[1];
    try{
      let byteCode = basicAuth.toByteArray(authCode);
      let emailAndPassword = new TextDecoder().decode(byteCode);
      if (!emailAndPassword.includes(':')){
         res.status(401).send({"error":"Unauthorized"});
      }
      emailAndPassword = emailAndPassword.split(':');
      let email = emailAndPassword[0];
      let hashedPassword = sha(emailAndPassword[1]);
      let user = database.database.collection('users').find({'email': email, 'password': hashedPassword}).toArray((err, result)=>{
        if (!err){
          if (result.length){
            let userResult = result[0];
	    let token = uuid.v4();
            cache.set("auth_" + token, userResult._id.toString(), 86400)
            res.status(200).send({'token': token});
          }else{
            res.status(401).send({"error":"Unauthorized"});
	  }
        }
      })
    } catch(e) {
    }
    }
    this.getDisconnect = async (req, res) =>{
      let tokenSupplied = req.header("X-Token");
      let userId = await cache.get('auth_' + tokenSupplied);
      if (userId) {
        let usr = database.database.collection('users').find({}).toArray((err, result)=>{
          if (!err){
            if (result.length){
              for (let i = 0; i < result.length; i++){
                if (result[i]._id.toString() === userId){
                  cache.del("auth_" + tokenSupplied);
		  res.status(201).send()
	        }
	      }
	    }else{
              res.status(401).send({"error":"Unauthorized"});
	    }
	  }
        })
      } else{
        res.status(401).send({"error":"Unauthorized"});
      }
    }
  }
}
const authContrllr = new AuthController()
module.exports = authContrllr;
