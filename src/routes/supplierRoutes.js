const express = require('express');
const supplierController = require('../controllers/supplierController');
const router = express.Router();

router.get('/get-suppliers', supplierController.getSuppliers);

module.exports = router;