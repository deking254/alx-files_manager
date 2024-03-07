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
    if (token) {
	    console.log('token exissts');
      const userId = await cache.get(`auth_${token}`);
      if (userId) {
        req.on('data', async (dat) => {
          console.log('data received');
          const data = JSON.parse(dat);
          if (data.name) {
		  console.log('name exists');
            if (data.type) {
		    console.log('type exists');
              if (data.type === 'file' || data.type === 'folder' || data.type === 'image') {
		      console.log('type is valid');
                if (data.type === 'file') {
                  console.log('type is file');
                  if (data.data) {
                    console.log('data exists');
		    const decryptedData = new TextDecoder().decode(base.toByteArray(data.data));
                    if (data.parentId) {
			    console.log('parentid exists');
                      const parentStatus = await db.database.collection('files').find({ parentId: data.parentId });
                      if (parentStatus) {
			      console.log('paretn exissts in db');
                        if (parent.ops[0].type !== 'folder') {
                          res.status(400).send({ error: 'Parent not folder' });
                        } else if (env.FOLDER_PATH) {
                          console.log('folder path provided');
                          const folder = file.exists(env.FOLDER_PATH, (err) => {
                            if (err) {
				    console.log('the provided folder exists');
                              data.userId = userId;
                              file.writeFile(`${env.FOLDER_PATH}/${v4().toString()}`, decryptedData, (err) => {
				      console.log('create adn write to the file');
                                db.database.collection('files').insertOne(data, (err, result) => {
                                  if (err === null) {
                                    console.log('inerted the doc successfully');
                                    res.status(201).send(result.ops[0]);
                                  } else {
                                    res.status(201).send({ error: 'Error adding to the database' });
                                  }
                                });
                              });
                            } else {
                              file.mkdir(env.FOLDER_PATH, { recurssive: true }, (err) => {
				      console.log('provided folder does not exist');
                                if (err === null) {
                                  console.log('provided folder created successfull');
                                  file.writeFile(`${env.FOLDER_PATH}/${v4().toString()}`, decryptedData, (err) => {
					  console.log('create adn write to the file');
                                    if (err === null) {
                                      data.userId = userId;
                                      db.database.collection('files').insertOne(data, (err, result) => {
					      console.log('inserting to the collection');
                                        if (err === null) {
                                          res.status(201).send(result.ops[0]);
                                        } else {
                                          res.status(201).send({ error: 'Error adding to db' });
                                        }
                                      });
                                    } else {
                                      // code for when the file could not be created
                                      res.status(400).send({ error: 'file/folder error' });
                                    }
                                  });
                                } else {
                                  // code for when the folder could not be created
                                  res.status(400).send({ error: 'file/folder error' });
                                }
                              });
                            }
                          });
                        } else {
                          file.exists('tmp/files_manager', (err) => {
                            if (err) {
                              data.userId = userId;
			      data.parentId = 0;
                              file.writeFile(`${'tmp/files_manager' + '/'}${v4().toString()}`, decryptedData, (err) => {
                                if (err === null) {
                                  db.database.collection('files').insertOne(data, (err, result) => {
                                    if (err === null) {
                                      res.status(201).send(result.ops[0]);
                                    } else {
                                      res.status(201).send({ error: 'Error adding to db' });
                                    }
                                  });
                                } else {
                                  // code for when the file could not be created
                                  res.status(400).send({ error: 'file/folder error' });
                                }
                              });
                            } else {
                              file.mkdir('tmp/files_manager', { recursive: true }, (err) => {
                                if (err === null) {
                                  data.userId = userId;
				  data.parentId = 0;
                                  file.writeFile(`${'tmp/files_manager' + '/'}${v4().toString()}`, decryptedData, (err) => {
                                    if (err === null) {
                                      db.database.collection('files').insertOne(data, (err, result) => {
                                        if (err === null) {
                                          res.status(201).send(result.ops[0]);
                                        } else {
                                          res.status(201).send({ error: 'Error adding to db' });
                                        }
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      } else {
                        res.status(400).send({ error: 'Parent not found' });
                      }
                    } else if (env.FOLDER_PATH) {
			    console.log('parentId not provided')
                      const folder = file.exists(env.FOLDER_PATH, (err) => {
                        if (err) {
				console.log('folder provided exists')
                          data.userId = userId;
			  data.parentId = 0;
                          file.writeFile(`${env.FOLDER_PATH}/${v4().toString()}`, decryptedData, (err) => {
				  console.log('writing to file')
                            db.database.collection('files').insertOne(data, (err, result) => {
				    console.log('adding to the collection')
                              if (err === null) {
                                res.status(201).send(result.ops[0]);
                              } else {
                                res.status(201).send({ error: 'Error adding to the database' });
                              }
                            });
                          });
                        } else {
                          file.mkdir(env.FOLDER_PATH, { recursive: true }, (err) => {
				  console.log('the provided folder exists')
                            if (err === null) {
				    console.log('writin to file')
                              file.writeFile(`${env.FOLDER_PATH}/${v4().toString()}`, decryptedData, (err) => {
                                if (err === null) {
					console.log('writing was a success')
                                  data.userId = userId;
				  data.parentId = 0;
                                  db.database.collection('files').insertOne(data, (err, result) => {
					  console.log('inserting to the dbb')
                                    if (err === null) {
                                      res.status(201).send(result.ops[0]);
                                    } else {
                                      res.status(201).send({ error: 'Error adding to db' });
                                    }
                                  });
                                } else {
                                  // code for when the file could not be created
                                  res.status(400).send({ error: 'file/folder error' });
                                }
                              });
                            } else {
                              // code for when the folder could not be created
                              res.status(400).send({ error: 'file/folder error' });
                            }
                          });
                        }
                      });
                    } else {
                      file.exists('tmp/files_manager', (err) => {
			      console.log('folder not provided')
                        if (err) {
				console.log('default folder exists')
                          data.userId = userId;
				data['parentId'] = 0;
                          file.writeFile(`${'tmp/files_manager' + '/'}${v4().toString()}`, decryptedData, (err) => {
				  console.log('writing to file')
                            if (err === null) {
				    console.log('inserting to db')
                              db.database.collection('files').insertOne(data, (err, result) => {
                                if (err === null) {
					console.log(result.ops[0])
                                  res.status(201).send(result.ops[0]);
                                } else {
                                  res.status(201).send({ error: 'Error adding to db' });
                                }
                              });
                            } else {
                              // code for when the file could not be created
                              res.status(400).send({ error: 'file/folder error' });
                            }
                          });
                        } else {
				console.log('the default folder does not exist')
                          file.mkdir('tmp/files_manager', { recursive: true }, (err) => {
				  console.log('creating the default dir')
				  console.log(err);
                            if (err === null) {
                              data.userId = userId;
			      data['parentId'] = 0;
                              file.writeFile(`${'tmp/files_manager' + '/'}${v4().toString()}`, decryptedData, (err) => {
				      console.log('writing file')
                                if (err === null) {
                                  db.database.collection('files').insertOne(data, (err, result) => {
					  console.log('inserting to db');
                                    if (err === null) {
					    console.log(result.ops[0]);
                                      res.status(201).send(result.ops[0]);
                                    } else {
                                      res.status(201).send({ error: 'Error adding to db' });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  } else {
                    res.status(400).send({ error: 'Missing data' });
                  }
                }
              } else {
                res.status(400).send({ error: 'Missing type' });
              }
            } else {
              res.status(400).send({ error: 'Missing type' });
            }
          } else {
            res.status(400).send({ error: 'Missing name' });
          }
        });
      } else {
        res.status(401).send({ error: 'Unauthorized' });
      }
    }
  }
}
const fileCtrlr = new FilesController();
module.exports = fileCtrlr;
