const chai = require('chai');
const chaiHttp = require('chai-http');
const uuidv4 = require('uuid');
const {MongoClient} = require('mongodb');
const {ObjectId} = require('bson');
const {promisify}  = require('util');
chai.use(chaiHttp);
describe('GET /files', () => {
    let initialFiles = []
    it('GET /files with no parentId and no page', (done) => {

        chai.request('http://localhost:5000')
            .get(`/files`)
	    .query({ page: 1 })
            .set('X-Token', "a4ddb079-ab84-482d-adb8-b316243fd23c")
            .end(async (err, res) => {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(200);

                const resList = res.body;
		   console.log(resList.length); 
                chai.expect(resList.length).to.equal(20);
                
                resList.forEach((item) => {
                    const itemIdx = initialFiles.findIndex((i) => i.id == item.id);
                    chai.assert.isAtLeast(itemIdx, 0);
                    
                    const itemInit = initialFiles.splice(itemIdx, 1)[0];
                    chai.expect(itemInit).to.not.be.null;

                    chai.expect(itemInit.id).to.equal(item.id);
                    chai.expect(itemInit.name).to.equal(item.name);
                    chai.expect(itemInit.type).to.equal(item.type);
                    chai.expect(itemInit.parentId).to.equal(item.parentId);
                });
                
                chai.expect(initialFiles.length).to.equal(5);

                done();
            });
    }).timeout(30000);
})
