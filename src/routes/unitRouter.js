const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

// Route để lấy danh sách tất cả các Units
router.get('/get-units', unitController.getAllUnits);

module.exports = router;
