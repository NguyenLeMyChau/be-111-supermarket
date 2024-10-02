const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const router = express.Router();


router.get('/get-warehouses', warehouseController.getWarehouses);

module.exports = router;