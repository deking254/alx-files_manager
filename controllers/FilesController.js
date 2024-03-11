const file = require('fs');
const { env } = require('process');
const { v4 } = require('uuid');
const base = require('base64-js');
const cache = require('../utils/redis');
const db = require('../utils/db');

class FilesController {
  constructor() {

  }

  async postUpload(req, res) {
  	    const token = req.header('X-Token');
	  let fileName = v4().toString();
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
											data.localPath = `${path}/${fileName}`
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
														//file.writeFileSync(`${path}/${fileName}`, decryptedData);
      															console.log('create adn write to the file');
															console.log('adding localpath attribute')
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
      														//this goes with the writefile async
															});
      													} else {
      														file.mkdir(path, { recurssive: true }, (err) => {
      															console.log('provided folder does not exist');
      															if (err === null) {
      																console.log('provided folder created successfull');
      																file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
																	//file.writeFileSync(`${path}/${fileName}`, decryptedData);
      																	console.log('create adn write to the file');
      																	if (err === null) {
      																		data.userId = userId;
      																		data.parentId = parentFileId;
      																		if (data.isPublic === undefined) {
      																			data.isPublic = false;
      																		}
																		console.log('adding localpath attribute')
																	
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
      																//this is for writefile above
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
							data.localPath = `${path}/${fileName}`
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
											//file.writeFileSync(`${path}/${fileName}`, decryptedData);
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
      											//this is for writefile above
												});
      										} else {
      											file.mkdir(path, { recursive: true }, (err) => {
      												console.log('provided folder does not exist');
      												if (err === null) {
      													console.log('provided folder created successfull');
      													file.writeFile(`${path}/${fileName}`, decryptedData, (err) => {
													//file.writeFileSync(`${path}/${fileName}`, decryptedData);
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
      														//this is for the err in writefile
													}
      													//this is for wrtiefie
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
									res.status(400).send({error: "Missing data"});
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
}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
