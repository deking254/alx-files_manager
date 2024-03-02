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

      let documentFinder = (doc)=>{
        db.database.collection('files').find(doc).toArray((err, result)=>{
          if (result.length){
            return result[0];
	  }
	})
	return null;
      }

      let checkDocType = (doc)=>{
        if (doc){
          if (doc.type === 'file'){
            return 'file';
	  }
          if (doc.type === 'folder'){
            return 'folder';
	  }
          if (doc.type === 'image'){
            return 'image';
	  }
	}
	return null;
      }

      let addDocToDb = (doc)=>{
        db.database.collection('files').insertOne(doc, ((err, result)=>{
          if (err === null){
            return result
	  }
	}))
	return null;
      }

      let createFolder = (folder)=>{
        file.mkdir(folder, {recursive: true}, (err)=>{
          if (err === null){
            return true;
	  }
	})
	return false;
      }

      let token = req.header('X-Token');
      if (token){
        userId = await cache.get('auth_' + token);
	if (!userId){
          authError();
	} else {
          req.on('data', (result)=>{
            let info = JSON.parse(result.toString());
            if (info.name){
             if (info.type){
              if (info.data){
              if (info.parentId){
                let doc = documentFinder({'parentId': info.parentId});
                if (doc){
                  let type = checkDocType(doc);
                  if (type){
                    if (type === 'folder'){
                      info['userId'] = userId;
		      res.status(201).send(addDocToDb(info));
                    }else {
                      parentError('Not folder');
                    }
                  }
                } else{
                  parentError('Not found');
                }
              }else{
                info['userId'] = userId;
		res.status(201).send(addDocToDb(info));
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
       }else {
        authError();
      }
    }
  }
}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
