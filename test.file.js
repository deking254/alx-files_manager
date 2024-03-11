const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
chai.use(chaiHttp);
it('POST /testing adding a file document', (done) => {
	const folderTmpFilesManagerPath = '/tmp/files_manager';
	let fileClearContent = 'Hello Webstack!\n' 
        let filesInTmpFilesManager = [];
	        if (fs.existsSync(folderTmpFilesManagerPath)) {
			
			            filesInTmpFilesManager = fs.readdirSync(folderTmpFilesManagerPath);
			console.log(`${filesInTmpFilesManager} = filesintmpfilemanager before the insertion`)
			        }else{
					console.log('folder does not exists. The request will create one');
				}
	let fileData = { "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }
        chai.request('http://localhost:5000')
	            .post('/files')
	            .set('X-Token', "053263ee-ca37-4baf-8d15-ba9de0ba19d4")
	            .send(fileData)
	            .end(async (err, res) => {
			                    chai.expect(err).to.be.null;
			                    chai.expect(res).to.have.status(201);

			                    const resFile = res.body;
			                    chai.expect(resFile.name).to.equal(fileData.name);
			                    chai.expect(resFile.userId).to.equal("65edb0303bb18509f5bf7862");
			                    chai.expect(resFile.type).to.equal(fileData.type);
			                    chai.expect(resFile.parentId).to.equal(0);
		    
                        let newFilesInTmpFilesManager = [];
	                        if (fs.existsSync(folderTmpFilesManagerPath)) {
					console.log('folder exists after request')
					                            newFilesInTmpFilesManager = fs.readdirSync(folderTmpFilesManagerPath);
					console.log(`${newFilesInTmpFilesManager} = files inside after insertion`)
					                        }else{
									console.log('folder does not exist after request')
								}
                                console.log(`${newFilesInTmpFilesManager.length} = newfilesintmpfiles manager ${filesInTmpFilesManager.length} = oldfilesintmpfilesmanager `);	
	                        chai.expect(newFilesInTmpFilesManager.length).to.equal(filesInTmpFilesManager.length + 1);
	                        const newFileInDiskPath = newFilesInTmpFilesManager.filter(x => !filesInTmpFilesManager.includes(x));
	                        
	                        const newFileInDiskContent = fs.readFileSync(`${folderTmpFilesManagerPath}/${newFileInDiskPath[0]}`).toString();
	                        chai.expect(newFileInDiskContent).to.equal(fileClearContent);
		    })
	done();
}).timeout(30000);
