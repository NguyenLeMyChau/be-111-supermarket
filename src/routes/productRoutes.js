const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

router.get('/get-categories', productController.getCategories);

router.get('/get-products', productController.getProducts);

module.exports = router;