const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

router.get('/get-categories', productController.getCategories);

router.post('/add-category', productController.addCategoryController);

router.put('/update-category/:categoryId', productController.updateCategoryController);

router.get('/get-products', productController.getProducts);

router.get('/get-products-by-supplier/:supplierId', productController.findProductBySupplierId);

router.get('/get-product-detail/:productId', productController.getProductsDetailController);

module.exports = router;