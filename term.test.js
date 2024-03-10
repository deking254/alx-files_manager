const chai = require('chai');
const chaiHttp = require('chai-http');

const uuidv4 = require('uuid').v4;

const MongoClient = require('mongodb');
const { promisify } = require('util');
const redis = require('redis');
const sha1 = require('sha1');
chai.use(chaiHttp);

describe('POST /files', () => {
    let testClientDb;
    let testRedisClient;
    let redisDelAsync;
    let redisGetAsync;
    let redisSetAsync;
    let redisKeysAsync;

    let initialUser = null;
    let initialUserId = null;
    let initialUserToken = null;

    const fctRandomString = () => {
	    console.log('fctrandomstring')
        return Math.random().toString(36).substring(2, 15);
    }
    const fctRemoveAllRedisKeys = async () => {
	    console.log('fctremoveallrediskeys starting now')
	 try{
        const keys = await redisKeysAsync('auth_*');
        keys.forEach(async (key) => {
            await redisDelAsync(key);
        });
	 }catch(e){
          console.log(e)
	 }
    }

    beforeEach(async () => {
	    console.log('beforeach starting now')
        const dbInfo = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '27017',
            database: process.env.DB_DATABASE || 'files_manager'
        };
	    console.log('dbinfo created')
        let a = await new Promise((resolve) => {
		console.log('weretr')
            MongoClient.connect(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`, { useUnifiedTopology: true }, async (err, client) => {
                testClientDb = client.db(dbInfo.database);
                console.log('aaanxa')
		    console.log(`the errror = ${err}`)
		    
                await testClientDb.collection('users').deleteMany({})
                await testClientDb.collection('files').deleteMany({})

                // Add 1 user
                initialUser = { 
                    email: `${fctRandomString()}@me.com`,
                    password: sha1(fctRandomString())
                }
		    console.log(initialUser);
                const createdDocs = await testClientDb.collection('users').insertOne(initialUser);
		    console.log('inserted into db')
                if (createdDocs && createdDocs.ops.length > 0) {
                    initialUserId = createdDocs.ops[0]._id.toString();
                }

                testRedisClient = redis.createClient();
                redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
                redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
                redisSetAsync = promisify(testRedisClient.set).bind(testRedisClient);
                redisKeysAsync = promisify(testRedisClient.keys).bind(testRedisClient);
		    console.log(redisKeysAsync);
                testRedisClient.on('connect', async () => {
			console.log('connected to the redis')
                    fctRemoveAllRedisKeys();

                    // Set token for this user
                    initialUserToken = uuidv4()
                    await redisSetAsync(`auth_${initialUserToken}`, initialUserId)
			console.log('added auth to redis')
                    resolve();
                });
            }); 
        });
	    return a;
    });
        
    afterEach(() => {
	    console.log('aftereach starting now')
        fctRemoveAllRedisKeys();
    });

    it('POST /files with invalid parentId', (done) => {
	    console.log('it')
        const fileData = {
            name: fctRandomString(),
            type: 'folder',
            parentId: initialUserId
        }
        chai.request('http://localhost:5000')
            .post('/files')
            .set('X-Token', initialUserToken)
            .send(fileData)
            .end(async (err, res) => {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(400);

                const resError = res.body.error;
                chai.expect(resError).to.equal("Parent not found");
                
                testClientDb.collection('files')
                    .find({})
                    .toArray((err, docs) => {
                        chai.expect(err).to.be.null;
                        chai.expect(docs.length).to.equal(0);

                        done();
                    })
            });
    }).timeout(30000);
});
