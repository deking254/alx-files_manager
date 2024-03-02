const db = require('../utils/db');
const file = require('fs');
const cache = require('../utils/redis');
const { env } = require('process');
const { v4 } = require('uuid');
const base = require('base64-js');

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

      let checkPath = ()=>{
        let path = env.FOLDER_PATH;
	if (path){
          return true;
	}
	return false;
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



      let checkTypeValidity = (doc)=>{
        if (type === 'folder' || type === 'image' || type === 'file'){
          return true;
	}
	return false;
      }


      let createFolder = (folder)=>{
	try{
          file.mkdir(folder, {recursive: true}, (result)=>{
           return result; 
	  })
	}catch(e){
          return false;
	}
      }


      let createFile = (path, doc)=>{
        file.exists(path, (result)=>{
          if (result){
	    let fileName = v4.toString();
	    let data = readData(doc);
	    if (data){
	     file.writeFile(fileName, data, (err)=>{
               return fileName;
	     })
	    }
	  }
	})
	return false;
      }



      let doOperation = (doc)=>{
        let type = checkDocType(doc);
	if (type){
          if (type === 'folder'){
            res.status(201).send(addDocToDb(doc)[0]);
	  }
	  if (type === 'file'){
            if (checkPath()){
              let folderCreationStatus = createFolder(env.FOLDER_PATH);
	      if (folderCreationStatus){
                createFile(env.FOLDER_PATH);
		res.status(201).send(addDocToDb(doc)[0]);
	      }
	    } else {
              let defaultFolder = createFolder('tmp/files_manager');
	      if (defaultFolder){
                createFile('tmp/files_manager');
		res.status(201).send(addDocToDb(doc)[0]);
	      }
	    }
	  }
	  if (type === 'image'){
            if (checkPath()){
              let folderCreationStatus = createFolder(env.FOLDER_PATH);
              if (folderCreationStatus){
                createFile(env.FOLDER_PATH);
                res.status(201).send(addDocToDb(doc)[0]);
              }
            } else {
              let defaultFolder = createFolder('tmp/files_manager');
              if (defaultFolder){
                createFile('tmp/files_manager');
                res.status(201).send(addDocToDb(doc)[0]);
              }
            } 
	  }
	}
      }


      let readData = (doc)=>{
        let data = doc.data;	 
	try{
	  let byteArray = base.toByteArray(data);
          let decoder = new TextDecoder();
	  return decoder.decoder(byteArray);
	}catch(e){
          return null;
	}
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
		      doOperation(info);
                    }else {
                      parentError('Not folder');
                    }
                  }
                } else{
                  parentError('Not found');
                }
              }else{
                info['userId'] = userId;
		doOperation(info);
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
