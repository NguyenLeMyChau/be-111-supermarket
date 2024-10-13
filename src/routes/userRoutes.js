
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


router.put('/update-user/:accountId', userController.updateUserController);

module.exports = router;
