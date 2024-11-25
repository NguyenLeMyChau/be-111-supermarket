const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const router = express.Router();

router.get('/get-all-invoice-refund', invoiceController.getAllInvoicesRefundController);
router.get('/get-all-invoice', invoiceController.getAllInvoicesController);
router.post('/get-invoice-by-invoiceCode', invoiceController.getInvoiceByInvoiceCodeController);
router.put('/update-status-order', invoiceController.updateStatusOrderController);

module.exports = router;