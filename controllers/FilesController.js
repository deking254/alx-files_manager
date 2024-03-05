const db = require('../utils/db');
const file = require('fs');
const cache = require('../utils/redis');
const { env } = require('process');
const { v4 } = require('uuid');
const base = require('base64-js');


class FilesController{
  constructor(){
    
  }
  async postUpload(req, res){
    let userId;
    if (req.header('X-Token')){
      userId = await cache.get('auth_' + req.header('X-Token'));
      if (!userId){
        this.authError(res);
      }
    }else{
      this.authError(res);
    }
    req.on('data', async (doc)=>{
      let object = JSON.parse(doc);
      if (object.name){
        if (object.type){
          if(this.checkTypeValidity(object)){
            if (object.data){
	      if (object.parentId){
                if (this.parentFinder(object, res)){
                  this.doOperation(object);
                  this.addDocToDb(object, userId, req, res);
                }
	      }else{
                this.doOperation(object);
		this.addDocToDb(object, userId, req, res);
	      }
            }else{
              if(this.checkDocType(object) !== 'folder'){
                this.dataError('data', res);
              }else{
              if (object.parentId){
                if (this.parentFinder(object, res)){
                  this.doOperation(object);
                  this.addDocToDb(object, userId, req, res);
                }
              }else{
                this.doOperation(object);
                this.addDocToDb(object, userId, req, res);
              }
              }
            }
          }else{
            this.dataError('type');
          }
        }else{
          this.dataError('type');
        }
      }else{
        this.dataError('name');
      }
    })
  }


  authError(res){
    res.status(401).send({"error":"Unauthorized"}); 
    return null;
  }

  dataError(field, res){
    res.status(400).send({"error": "Missing " + field});
    return null;
  }


  parentError(desc, res){
    if (desc === 'Not found'){
      res.status(400).send({"error": 'Parent not found'});
    } 
    if (desc ==='Not folder'){
      res.status(400).send({"error": "Parent is not a folder"})
    }
    return null;
  }

    async documentFinder(doc){
      await db.database.collection('files').find(doc).toArray((err, result)=>{
          if (result.length){
            return result[0];
	        }   
	    })
	    return null;
    }


    checkPath(){
      let path = env.FOLDER_PATH;
	    if (path){
        return true;
	    }
	    return false;
    }


    checkDocType(doc){
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



    addDocToDb(doc, userId, req, res){
      let documentFile =  {'userId': userId, 'name': doc.name, 'type': doc.type, 'isPublic': doc.isPublic ? doc.isPublic : false, 'parentId': doc.parentId ? doc.parentId : 0}
      db.database.collection('files').insertOne(documentFile, (err, result)=>{
        if (err === null){
         let finalDoc = result.ops[0];
	 res.status(201).send(finalDoc);
	}else{
          res.status(400).send({"error": err});
	}
      });
    }



    checkTypeValidity(doc){
      if (doc.type === 'folder' || doc.type === 'image' || doc.type === 'file'){
        return true;
	    }
	    return false;
    }


    createFolder(folder, object){
      file.mkdir(folder, {recursive: true}, (error)=>{
        if (error === null){
          this.createFile(folder, object); 
	}else{
          return false;
	}
      });
    }


    createFile(path, doc){
      file.exists(path, (result)=>{
        if (result){
	   let fileName = v4().toString();
	   let data = this.readData(doc);
	   if (data){
	     file.writeFile(path + '/' + fileName, data, (err)=>{
              if (err){
                console.log(err);
	      }
	     })
	   }
	}
      })
    }



    doOperation(doc){
      let type = this.checkDocType(doc);
      if (type){
	if (type === 'file'){
          if (this.checkPath()){
            this.createFolder(env.FOLDER_PATH, doc);
          }else{
            this.createFolder('tmp/files_manager', doc);
	  }
	}
	if (type === 'image'){

        }
      }
    }




    async parentFinder(doc, res){
      await db.database.collection('files').find(doc).toArray((err, result)=>{
        if (result.length > 0){
	        if (result[0].type != 'folder'){
            this.parentError('Not folder', res);
	          return null;
	        }else{
            return result[0];
	        }
	      }else{
          this.parentError('Not found', res);
          return null;
        }
	    })
	    return null;
    }


    readData(doc){
      let data = doc.data;	 
	    try{
	      let byteArray = base.toByteArray(data);
        let decoder = new TextDecoder();
	      return decoder.decode(byteArray);
	    }catch(e){
		    console.log(e);
        return null;
	    }
    }
}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
