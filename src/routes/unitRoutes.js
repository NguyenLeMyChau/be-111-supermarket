const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

// Route để lấy danh sách tất cả các Units
router.get('/get-units', unitController.getAllUnits);

router.get('/get-unit/:unitId', unitController.getUnitById);

module.exports = router;
