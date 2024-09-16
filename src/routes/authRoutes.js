const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Đăng xuất
router.post('/logout', authMiddleware(['manager', 'staff', 'customer']), authController.logout);

//refresh token
router.post('/refresh', authController.requestRefreshToken);

// Lấy toàn bộ danh sách account
router.get('/accounts', authMiddleware(['manager']), authController.getAccounts);

module.exports = router;
