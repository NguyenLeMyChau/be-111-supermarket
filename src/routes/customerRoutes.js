const express = require('express');
const customerController = require('../controllers/customerController');
const router = express.Router();

router.get('/get-cart-by-id', customerController.getCartByIdController);

router.post('/add-product-to-cart', customerController.addProductToCartController);

router.post('/pay-cart', customerController.payCartController);

router.post('/update-cart', customerController.updateCartController);

router.post('/remove-product-cart', customerController.removeProductCartController);

router.post('/update-product-cart', customerController.updateProductCartController);

router.put('/update-customer/:accountId', customerController.updateCustomerInfoController);

module.exports = router;