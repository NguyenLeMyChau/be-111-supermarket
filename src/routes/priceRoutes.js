
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

router.get('/productPrice', priceController.getAllProductPrice);
router.post('/addPriceHeader', priceController.addProductPrice);
router.put('/updatePriceHeader/:priceId', priceController.updateProductPrice);
router.post('/addPriceDetail', priceController.addProductPriceDetail);
router.put('/updatePriceDetail/:priceDetailid', priceController.updateProductPriceDetail);
router.get('/getProductNoPrice',priceController.getProductsWithoutPrice);


module.exports = router;
