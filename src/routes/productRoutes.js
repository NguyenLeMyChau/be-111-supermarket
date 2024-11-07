const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

router.get('/get-categories', productController.getCategories);

router.delete('/delete-category/:categoryId', productController.deleteCategoryController);

router.post('/add-category', productController.addCategoryController);

router.put('/update-category/:categoryId', productController.updateCategoryController);

router.get('/get-products', productController.getProducts);

router.get('/get-products-by-supplier/:supplierId', productController.findProductBySupplierId);

router.get('/get-product-detail/:productId', productController.getProductsDetailController);

router.post('/add-product', productController.addProductWithWarehouseController);

router.put('/update-product/:productId', productController.updateProductController);

router.get('/get-products-with-price-and-promotion', productController.getProductsWithPriceAndPromotion);

module.exports = router;