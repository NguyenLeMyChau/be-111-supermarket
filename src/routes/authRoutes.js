const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const promotionController = require('../controllers/promotionController');
const customerController = require('../controllers/customerController');


// Đăng ký nhân viên
router.post('/register-employee', authMiddleware(['manager']), authController.register);

// Đăng ký khách hàng
router.post('/register-customer', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Đăng xuất
router.post('/logout', authMiddleware(['manager', 'staff', 'customer']), authController.logout);

//refresh token
router.post('/refresh', authController.requestRefreshToken);

// Lấy toàn bộ danh sách account
router.get('/accounts', authMiddleware(['manager']), authController.getAccounts);

// Lấy thông tin hàng hoá cho customer
router.get('/get-categories', productController.getCategories);

router.get('/get-products-with-price-and-promotion', productController.getProductsWithPriceAndPromotion);

router.get('/get-products-with-price-and-promotion-no-category', productController.getAllProductsWithPriceAndPromotionNoCategoryController);

router.post('/get-promotion-by-product',promotionController.getPromotionsByProductIdsController);

router.get('/get-promotions', promotionController.getPromotionsActive);

router.post('/get-product-by-barcode',productController.getProductsByBarcodeInUnitConvertController)

router.post('/pay-cart-web', customerController.payCartWebController);

router.get('/get-customer-by-phone/:phone', customerController.getCustomerByPhoneController);


module.exports = router;
