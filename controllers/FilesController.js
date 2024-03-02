const db = require('../utils/db');
const file = require('fs');
const cache = require('../utils/redis');
const { env } = require('process')

class FilesController{
  constructor(){
    this.postUpload = async (req, res)=>{
      let userId;
      let authError = ()=>{
        res.status(401).send({"error":"Unauthorized"});
      }
      let dataError = (field)=>{
        res.status(400).send({"error": "Missing " + field});
      }
      let parentError = (desc)=>{
        if (desc === 'Not found'){
          res.status(400).send({"error": 'Parent not found'})
	}
	if (desc ==='Not folder'){
          res.status(400).send({"error": "Parent is not a folder"})
	}
      }

      let documentFinder = ()=>{
        db.database.collection('files').find({}).toArray((err, result)=>{
          
	})
      }
      let token = req.header('X-Token');
      if (token){
        userId = await cache.get('auth_' + token);
	if (!userId){
          authError();
	}
      }else {
        authError();
      }
      req.on('data', (result)=>{
        let info = JSON.parse(result.toString());
	if (info.name){
	  if (info.type){
	    if (info.data){
              if (info.parentId){
                db.database.collection('files').find({}).toArray((err, result)=>{
                  if (err === null){
                    if (result.length){
		      let found = false;
		      let folder = false;
                      for (let i = 0; i < result.length; i++){
                        if (result[i]._id.toString() === info.parentId){
                          found = true;
			  if (result[i].type === 'folder'){
                            folder = true;
			    info['userId'] = userId;
		            if (info.type === 'folder'){
		              db.database.collection('files').insertOne(info);
			      res.status(201).send(info);
			    }
			  }
			  if (result[i].type === 'file'){
                            if (env.FOLDER_PATH){
			       
			    }
			  }
			}
		      }
		      if (!found){
                        parentError('Not found');
		      } else{
                        if (!folder){
                          parentError('Not folder')
			}
		      }
		    } else {
                      parentError('Not found');
		    }
		  }
		}) 
	      }else{
                db.database.collection('files')
	      }
	    } else {
              dataError('data');
	    }
	  } else{
            dataError('type');
	  }
	}else {
          dataError('name');
	}
      })
    }
  }

}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
