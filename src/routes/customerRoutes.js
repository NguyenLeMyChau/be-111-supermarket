const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

router.get('/get-categories', productController.getCategories);

module.exports = router;