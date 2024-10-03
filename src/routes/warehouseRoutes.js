const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const router = express.Router();


router.get('/get-warehouses', warehouseController.getWarehouses);
router.get('/get-products-by-warehouse/:warehouseId', warehouseController.getProductByWarehouse);
router.post('/order-product-from-supplier', warehouseController.orderProductFromSupplierController);
router.put('/update-order-status', warehouseController.updateOrderStatusController);

module.exports = router;