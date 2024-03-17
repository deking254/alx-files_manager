const file = require('fs');
const { env } = require('process');
const { v4 } = require('uuid');
const base = require('base64-js');
const { ObjectId } = require('bson');
const cache = require('../utils/redis');
const db = require('../utils/db');

class FilesController {
  constructor() {

  }

  async postUpload(req, res) {
  	    const token = req.header('X-Token');
	  const fileName = v4().toString();
    if (token) {
	    console.log('token exissts');
      const userIdInCache = await cache.get(`auth_${token}`);
	    console.log(userIdInCache);
      db.database.collection('users').find({}).toArray((err, result) => {
      	let userId;
      	let foundUser = false;
      	if (result.length > 0) {
      		for (let i = 0; i < result.length; i++) {
      			if (result[i]._id.toString() === userIdInCache) {
      				userId = result[i]._id;
      				foundUser = true;
      			}
      		}
      		if (foundUser) {
      			req.on('data', (dat) => {
      				const data = JSON.parse(dat);
              console.log(data);
      				if (data.name) {
      					if (data.parentId) {
      						db.database.collection('files').find({}).toArray((err, result) => {
      							let parentFileId = null;
      							let foundParent = false;
      							let parentAFolder = false;
      							for (let i = 0; i < result.length; i++) {
      								if (result[i]._id.toString() === data.parentId) {
      									foundParent = true;
      									if (result[i].type === 'folder') {
      									  parentFileId = result[i]._id;
      									  parentAFolder = true;
      									}
      								}
      							}
      							if (foundParent) {
      								if (parentAFolder) {
      									if (data.type === 'file' || data.type === 'folder' || data.type === 'image') {
      										const path = env.FOLDER_PATH ? env.FOLDER_PATH : '/tmp/files_manager';
      										if (data.type === 'file') {
                            data.localPath = `${path}/${fileName}`;
      											if (data.data) {
      												const decryptedData = new TextDecoder().decode(base.toByteArray(data.data));
      												file.exists(path, (err) => {
      													if (err) {
      														console.log('the provided folder exists');
      														data.userId = userId;
      														data.parentId = parentFileId;
      														if (data.isPublic === undefined) {
      															data.isPublic = false;
      														}

      														file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
                                    // file.writeFileSync(`${path}/${fileName}`, decryptedData);
      															console.log('create adn write to the file');
                                    console.log('adding localpath attribute');
      															db.database.collection('files').insertOne(data, (err, result) => {
      																if (err === null) {
      																	console.log('inerted the doc successfully');
      																	const object = {};
      																	object.id = result.ops[0]._id;
      																	object.userId = result.ops[0].userId.toString();
      																	object.type = result.ops[0].type;
                                        object.name = result.ops[0].name;
      																	object.isPublic = result.ops[0].isPublic;
      																	object.parentId = result.ops[0].parentId;
      																	res.status(201).send(object);
      																} else {
      																	res.status(201).send({ error: 'Error adding to the database' });
      																}
      															});
      														// this goes with the writefile async
                                  });
      													} else {
      														file.mkdir(path, { recurssive: true }, (err) => {
      															console.log('provided folder does not exist');
      															if (err === null) {
      																console.log('provided folder created successfull');
      																file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
                                        // file.writeFileSync(`${path}/${fileName}`, decryptedData);
      																	console.log('create adn write to the file');
      																	if (err === null) {
      																		data.userId = userId;
      																		data.parentId = parentFileId;
      																		if (data.isPublic === undefined) {
      																			data.isPublic = false;
      																		}
                                          console.log('adding localpath attribute');

      																		db.database.collection('files').insertOne(data, (err, result) => {
      																			console.log('inserting to the collection');
      																			if (err === null) {
      																				const object = {};
      																				object.id = result.ops[0]._id;
      																				object.userId = result.ops[0].userId.toString();
      																				object.type = result.ops[0].type;
      																				object.isPublic = result.ops[0].isPublic;
      																				object.parentId = result.ops[0].parentId;
                                              object.name = result.ops[0].name;
      																				res.status(201).send(object);
      																			} else {
      																				res.status(201).send({ error: 'Error adding to db' });
      																			}
      																		});
      																	}
      																// this is for writefile above
                                      });
      															} else {
                                      // code for when the folder could not be created
                                      res.status(400).send({ error: 'file/folder error' });
                                    }
                                  });
      													}
      												});
      											} else {
      												// data missing
                              res.status(400).send({ error: 'Missing data' });
      											}
      										}
      										if (data.type === 'folder') {
      											file.exists(`/${path}/${data.name}/`, (err) => {
      												if (err) {
      													console.log('the provided folder exists');
      													data.userId = userId;
      													data.parentId = parentFileId;
      													if (data.isPublic === undefined) {
      														data.isPublic = false;
      													}
      													db.database.collection('files').insertOne(data, (err, result) => {
      														if (err === null) {
      															const object = {};
      															object.id = result.ops[0]._id;
      															object.userId = result.ops[0].userId.toString();
                                    object.name = result.ops[0].name;
      															object.type = result.ops[0].type;
      															object.isPublic = result.ops[0].isPublic;
      															object.parentId = result.ops[0].parentId;
      															res.status(201).send(object);
      														} else {
      															// insertion error
      														}
      													});
      												} else {
      													file.mkdir(`${path}/${data.name}`, { recursive: true }, (err) => {
      														console.log('provided folder does not exist');
      														if (err === null) {
      															console.log('provided folder created successfull');
      															data.userId = userId;
      															data.parentId = parentFileId;
      															if (data.isPublic === undefined) {
      																data.isPublic = false;
      															}
      															db.database.collection('files').insertOne(data, (err, result) => {
      																if (err === null) {
      																	const object = {};
      																	object.id = result.ops[0]._id;
      																	object.userId = result.ops[0].userId.toString();
      																	object.type = result.ops[0].type;
                                        object.name = result.ops[0].name;
      																	object.isPublic = result.ops[0].isPublic;
      																	object.parentId = result.ops[0].parentId;
      																	res.status(201).send(object);
      																} else {
      															// insertion error
      														}
      													});
      														} else {
                                  // code for when the folder could not be created
                                    res.status(400).send({ error: 'file/folder error' });
                                  }
                                });
      												}
      											});
      										}
      										if (data.type === 'image') {
      											// handle for when type is image and the parentId was set and is valid
      										}
      									} else {
      										// type not valid
                          res.status(400).send({ error: 'Missing type' });
      									}
      								} else {
      									// parentNot a folder
                        res.status(400).send({ error: 'Parent is not a folder' });
      								}
      							} else {
      								// parent not found
                      res.status(400).send({ error: 'Parent not found' });
      							}
      						});
      					} else {
      						// parentId was not set. implement for the different types  and make parentId to be 0
      						if (data.type === 'file' || data.type === 'folder' || data.type === 'image') {
      							const path = env.FOLDER_PATH ? env.FOLDER_PATH : '/tmp/files_manager';
                    data.localPath = `${path}/${fileName}`;
                    data.parentId = 0;
      							if (data.type === 'file') {
      								if (data.data) {
      									const decryptedData = new TextDecoder().decode(base.toByteArray(data.data));
      									file.exists(path, (err) => {
      										if (err) {
      											console.log('the provided folder exists');
      											data.userId = userId;
      											if (data.isPublic === undefined) {
      												data.isPublic = false;
      											}
      											file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
                              // file.writeFileSync(`${path}/${fileName}`, decryptedData);
      												console.log('create adn write to the file');
      												db.database.collection('files').insertOne(data, (err, result) => {
      													if (err === null) {
      														console.log('inerted the doc successfully');
      														const object = {};
      														object.id = result.ops[0]._id;
                                  console.log(result.ops[0]);
      														object.userId = result.ops[0].userId.toString();
                                  object.name = result.ops[0].name;
      														object.type = result.ops[0].type;
      														object.isPublic = result.ops[0].isPublic;
      														object.parentId = 0;
      														res.status(201).send(object);
      													} else {
      														res.status(201).send({ error: 'Error adding to the database' });
      													}
      												});
      											// this is for writefile above
                            });
      										} else {
      											file.mkdir(path, { recursive: true }, (err) => {
      												console.log('provided folder does not exist');
      												if (err === null) {
      													console.log('provided folder created successfull');
      													file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
                                  // file.writeFileSync(`${path}/${fileName}`, decryptedData);
      														console.log('create adn write to the file');
      														if (err === null) {
      															data.userId = userId;
      															if (data.isPublic === undefined) {
      																data.isPublic = false;
      															}
      															db.database.collection('files').insertOne(data, (err, result) => {
      																console.log('inserting to the collection');
      																if (err === null) {
      																	const object = {};
      																	object.id = result.ops[0]._id;
                                        console.log(result.ops[0]);
      																	object.userId = result.ops[0].userId.toString();
      																	object.type = result.ops[0].type;
                                        object.name = result.ops[0].name;
      																	object.isPublic = result.ops[0].isPublic;
      																	object.parentId = 0;
      																	res.status(201).send(object);
      																} else {
      																	res.status(201).send({ error: 'Error adding to db' });
      																}
      															});
      														// this is for the err in writefile
                                  }
      													// this is for wrtiefie
                                });
      												} else {
                                // code for when the folder could not be created
                                res.status(400).send({ error: 'file/folder error' });
                              }
                            });
      										}
      									});
      								} else {
      												// data missing
                        res.status(400).send({ error: 'Missing data' });
      											}
      										}
      										if (data.type === 'folder') {
      											file.exists(`${path}/${data.name}`, (err) => {
      												if (err) {
      													console.log('the provided folder exists');
      													data.userId = userId;
      													data.parentId = 0;
      													if (data.isPublic === undefined) {
      														data.isPublic = false;
      													}
      													db.database.collection('files').insertOne(data, (err, result) => {
      														if (err === null) {
      															const object = {};
      															object.id = result.ops[0]._id;
      															object.userId = result.ops[0].userId.toString();
                              object.name = result.ops[0].name;
      															object.type = result.ops[0].type;
      															object.isPublic = result.ops[0].isPublic;
      															object.parentId = result.ops[0].parentId;
      															res.status(201).send(object);
      														} else {
      															// insertion error
      														}
      													});
      												} else {
      													file.mkdir(`${path}/${data.name}`, { recursive: true }, (err) => {
      														console.log('provided folder does not exist');
      														if (err === null) {
      															console.log('provided folder created successfull');
      															data.userId = userId;
      															data.parentId = 0;
      															if (data.isPublic === undefined) {
      																data.isPublic = false;
      															}
      															db.database.collection('files').insertOne(data, (err, result) => {
      																if (err === null) {
      																	const object = {};
      																	object.id = result.ops[0]._id;
      																	object.userId = result.ops[0].userId.toString();
                                  object.name = result.ops[0].name;
      																	object.type = result.ops[0].type;
      																	object.isPublic = result.ops[0].isPublic;
      																	object.parentId = result.ops[0].parentId;
      																	res.status(201).send(object);
      																} else {
      															// insertion error
      														}
      													});
      														} else {
                              // code for when the folder could not be created
                              console.log(err);
                              res.status(400).send({ error: 'file/folder error' });
                            }
                          });
      												}
      											});
      										}
      										if (data.type === 'image') {
      											// handle when the type is image and the parentId was not set
      										}
      						} else {
      							// type is not valid
                    res.status(400).send({ error: 'Missing type' });
      						}
      					}
      				} else {
      					// name doesn not exists
                res.status(400).send({ error: 'Missing name' });
      				}
      			});
      		} else {
      			// when the login user could not be found in the db
            res.status(401).send({ error: 'Unauthorized' });
      		}
      	} else {
      		// no users
          res.status(401).send({ error: 'Unauthorized' });
      	}
      });
    } else {
    	// unauthorized
	    res.status(401).send({ error: 'Unauthorized' });
    }
  }

  async getShow(req, res) {
	  console.log('endpoint works');
    const userToken = req.header('X-Token');
    const { id } = req.params;
	  console.log(`${id} = id in param`);
    if (userToken) {
	   console.log('usertoken was added');
      const userId = await cache.get(`auth_${userToken}`);
	   console.log(userId);
      if (userId) {
        if (id) {
          db.database.collection('files').find({ userId: ObjectId(userId) }).toArray((err, result) => {
	   const files = [];
		  console.log('tuko kwa get show');
	   let found = false;
            for (let i = 0; i < result.length; i++) {
	     if (result[i]._id.toString() === req.params.id) {
	       found = true;
	       const object = {};
	       object.id = result[i]._id;
	       object.userId = result[i].userId;
                object.name = result[i].name;
	       object.type = result[i].type;
	       object.isPublic = result[i].isPublic;
	       object.parentId = result[i].parentId;
	       res.status(200).send(object);
	       break;
	     }
	   }
	   if (found === false) {
              res.status(404).send({ error: 'Not found' });
	   }
          });
        }
      } else {
        res.status(401).send({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }

  async getIndex(req, res) {
    const userToken = req.header('X-Token');
    const page = req.query.page || '0';
    if (userToken) {
      console.log('usertoken was added');
      const userId = await cache.get(`auth_${userToken}`);
      console.log(userId);
      if (userId) {
	     const paramId = this.getParamId(req);
	       if (paramId) {
          db.database.collection('files').find({ parentId: paramId, userId: ObjectId(userId) }).skip(parseInt(page) * 20).limit(20)
            .toArray((err, result) => {
           	const files = [];
              console.log(result.length);
           	if (err === null) {
             	  if (result.length > 0) {
               	    for (let i = 0; i < result.length; i++) {
                    const object = {};
                    object.id = result[i]._id;
                    object.userId = result[i].userId;
                    object.name = result[i].name;
                    object.type = result[i].type;
                    object.isPublic = result[i].isPublic;
                    object.parentId = result[i].parentId;
                    files.push(object);
                  }
		  }
                res.status(200).send(files);
              }
            });
	       } else {
          db.database.collection('files').find({ userId: ObjectId(userId) }).skip(parseInt(page) * 20).limit(20)
            .toArray((err, result) => {
              const files = [];
              console.log(result.length);
              if (err === null) {
                if (result.length > 0) {
                  for (let i = 0; i < result.length; i++) {
                    const object = {};
                    object.id = result[i]._id;
                    object.userId = result[i].userId;
                    object.name = result[i].name;
                    object.type = result[i].type;
                    object.isPublic = result[i].isPublic;
                    object.parentId = result[i].parentId;
                    files.push(object);
                  }
                }
                res.status(200).send(files);
              }
            });
	       }
      } else {
        res.status(401).send({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }

  getParamId(req) {
    const id = req.query.parentId;
    if (id) {
      try {
        const paramId = ObjectId(id);
        return paramId;
      } catch (e) {
        return id;
      }
    } else {
      return false;
    }
  }
  

  async putPublish(req, res){
    let token = req.header('X-Token');
    let userId = await cache.get('auth_' + token);
    if (userId){
	    console.log(userId);
    const { id } = req.params;
      db.database.collection('files').find({"_id": ObjectId(id), "userId": ObjectId(userId)}).toArray((err, file)=>{
	if (err === null){
	  if (file.length >= 1){
          db.database.collection('files').updateOne({"_id": ObjectId(id), "userId": ObjectId(userId)}, {$set:{"isPublic": true}}, (err, result)=>{
          if (err === null){
            db.database.collection('files').find({"_id": ObjectId(id), "userId": ObjectId(userId)}).toArray((err, modified)=>{
              if (err === null){
                let object = {};
                object.id = modified[0]._id;
                object.name = modified[0].name;
                object.userId = modified[0].userId;
                object.type = modified[0].type;
                object.isPublic = modified[0].isPublic;
                object.parentId = modified[0].parentId;	      
                res.status(200).send(object);
              }
            })
          }
	})
	  }else{
            res.status(404).send({"error": "Not found"});
	  }
       }else{
        res.status(404).send({"error": "Not found"});
       }
      })
    }else{
     res.status(401).send({"error": "Unauthorized"});
    }
  }


  async putUnpublish(req, res){
    let token = req.header('X-Token');
    let userId = await cache.get('auth_' + token);
    if (userId){
            console.log(userId);
    const { id } = req.params;
      db.database.collection('files').find({"_id": ObjectId(id), "userId": ObjectId(userId)}).toArray((err, file)=>{
        if (err === null){
          if (file.length >= 1){
          db.database.collection('files').updateOne({"_id": ObjectId(id), "userId": ObjectId(userId)}, {$set:{"isPublic": false}}, (err, result)=>{
          if (err === null){
	    db.database.collection('files').find({"_id": ObjectId(id), "userId": ObjectId(userId)}).toArray((err, modified)=>{
	      if (err === null){
		let object = {};
		object.id = modified[0]._id;
		object.name = modified[0].name;
		object.userId = modified[0].userId;
		object.type = modified[0].type;
		object.isPublic = modified[0].isPublic;
		object.parentId = modified[0].parentId;
                res.status(200).send(object);
	      }
	    })
          }
        })
          }else{
            res.status(404).send({"error": "Not found"});
          }
       }else{
        res.status(404).send({"error": "Not found"});
       }
      })
    }else{
     res.status(401).send({"error": "Unauthorized"});
    }
  }


  async getFile(req, res){
    let token = req.header('X-Token');
    let userId = await cache.get('auth_' + token);
    if (userId){
	    console.log(`id is ${req.params.id}`);
      db.database.collection('files').find({"_id": ObjectId(req.params.id)}).toArray((err, result)=>{
        if (err === null){
          if (result.length > 0){
	    if (result[0].isPublic){
		if (result[0].type !== 'folder'){
                  file.exists(result[0].localPath, async (exists)=>{
                    if (exists){
		      res.status(200).send(file.readFileSync(result[0].localPath).toString());
		    }else{
			    console.log("localpath not existent")
                      res.status(404).send({"error": "Not found"});
		    }
		  })       
		}else{
                  res.status(400).send({"error": "A folder doesn't have content"})
		}
	    }else{
		    console.log(`THE LOGGED IN USERID IS ${userId}`)
		    console.log(`THE FOUND FILE BELONGS TO ${result[0].userId.toString()}`)
	      if (userId === result[0].userId.toString()){
                if (result[0].type !== 'folder'){
			console.log('sio public so now we check if he owns the found file')
			console.log(result[0].localPath)
                  file.exists(result[0].localPath, async (exists)=>{
                    if (exists){
                      res.status(200).send(file.readFileSync(result[0].localPath).toString());
                    }else{
                            console.log("localpath not existent")
                      res.status(404).send({"error": "Not found"});
                    }
                  })
                }else{
                  res.status(400).send({"error": "A folder doesn't have content"})
                }		     
	      }else{
		console.log('yoou are not the owner and its not public');
	        res.status(404).send({"error": "Not found"});
              }
	    }
	  }else{
             console.log("length of result == 0")
            res.status(404).send({"error": "Not found"});
	  }
	}
      })
    }else{
	    console.log("unautho")
      res.status(404).send({"error": "Not found"});
    }
  }
}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
