const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const router = express.Router();


router.get('/get-all-invoice', invoiceController.getAllInvoicesController);

module.exports = router;