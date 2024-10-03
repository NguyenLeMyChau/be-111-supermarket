const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const router = express.Router();


router.get('/get-warehouses', warehouseController.getWarehouses);
router.get('/get-products-by-warehouse/:warehouseId', warehouseController.getProductByWarehouse);
router.get('/get-all-orders', warehouseController.getAllOrdersController);
router.post('/order-product-from-supplier', warehouseController.orderProductFromSupplierController);
router.put('/update-order-status', warehouseController.updateOrderStatusController);
router.get('/get-warehouse-by-supplier', warehouseController.getWarehousesFromSupplierIdController);

module.exports = router;