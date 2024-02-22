const router = require('express').Router();
const appCtrl = require('../controllers/AppController');
const userCtrl = require('../controllers/UsersController');
router.get('/status', (req, res)=>{
  appCtrl.getStatus(res);
})
router.get('/stats', (req, res)=>{
  appCtrl.getStats(res);
})
router.post('/users', (req, res)=>{
req.on('data', (i)=>{
  let data = JSON.parse(String(i))
  userCtrl.postNew(req, res, data.email, data.password);
})
})
module.exports = router;
