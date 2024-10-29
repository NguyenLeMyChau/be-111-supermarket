
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

router.get('/productPrice', priceController.getAllProductPrice);
router.post('/addPriceHeader', priceController.addProductPrice);
router.post('/copyProductPrice', priceController.copyProductPrice);
router.put('/updatePriceHeader/:priceId', priceController.updateProductPrice);
router.post('/addPriceDetail', priceController.addProductPriceDetail);
router.put('/updatePriceDetail/:priceDetailid', priceController.updateProductPriceDetail);
router.get('/getProductNoPrice',priceController.getProductsWithoutPrice);
router.delete('/delete-header/:productPriceHeader_id', priceController.deleteHeaderController);
router.delete('/delete-detail/:productPriceDetail_id', priceController.deleteDetailController);

module.exports = router;
