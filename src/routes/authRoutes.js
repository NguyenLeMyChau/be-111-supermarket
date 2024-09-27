const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

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

module.exports = router;
