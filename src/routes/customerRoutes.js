const express = require('express');
const customerController = require('../controllers/customerController');
const router = express.Router();

router.get('/get-cart-by-id', customerController.getCartByIdController);

router.post('/add-product-to-cart', customerController.addProductToCartController);

module.exports = router;