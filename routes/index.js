const router = require('express').Router();
const appCtrl = require('../controllers/AppController');
const userCtrl = require('../controllers/UsersController');
const authCtrl = require('../controllers/AuthController');
const fileCtrl = require('../controllers/FilesController');
const urlDecoder = require('qs');
router.get('/status', (req, res)=>{
  appCtrl.getStatus(res);
})
router.get('/stats', (req, res)=>{
  appCtrl.getStats(res);
})
router.post('/users', (req, res)=>{
req.on('data', (i)=>{
  let data = JSON.parse(String(i));
  if (!data.email){
    res.status(400).send({"error":"Missing email"});
  }
  if (!data.password){
    res.status(400).send({"error":"Missing password"});
  }
  if (data.email && data.password){
    userCtrl.postNew(req, res, data.email, data.password);
  }
})
})
router.get('/connect', (req, res)=>{
  authCtrl.getConnect(req, res);
})
router.get('/disconnect', (req, res)=>{
  authCtrl.getDisconnect(req, res);
})
router.get('/users/me', (req, res)=>{
  userCtrl.getMe(req, res);
})
router.post('/files', (req, res)=>{
  fileCtrl.postUpload(req, res);
})
module.exports = router;
