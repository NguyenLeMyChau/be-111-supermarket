const express = require('express');
const supplierController = require('../controllers/supplierController');
const router = express.Router();

router.get('/get-suppliers', supplierController.getSuppliers);

router.post('/add-supplier', supplierController.addSupplierController);

router.put('/update-supplier/:supplierId', supplierController.updateSupplierController);

router.delete('/delete-supplier/:supplierId', supplierController.deleteSupplierController);

module.exports = router;