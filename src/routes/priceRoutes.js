
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

router.get('/productPrice', priceController.getAllProductPrice);


module.exports = router;
