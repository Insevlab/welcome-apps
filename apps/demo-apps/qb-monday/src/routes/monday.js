const router = require('express').Router();
const { authenticationMiddleware } = require('../middlewares/authentication');
const { addIntuitAuthentication } = require('../middlewares/intuit-auth');
const mondayController = require('../controllers/monday-controller');


router.post('/monday/post_data', addIntuitAuthentication, authenticationMiddleware, mondayController.postData);

module.exports = router;
