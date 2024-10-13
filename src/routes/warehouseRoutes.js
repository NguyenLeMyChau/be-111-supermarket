const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const router = express.Router();


router.get('/get-warehouses', warehouseController.getWarehouses);
router.get('/get-all-orders', warehouseController.getAllOrdersController);
router.post('/order-product-from-supplier', warehouseController.orderProductFromSupplierController);
router.put('/update-order-status', warehouseController.updateOrderStatusController);
router.post('/add-bill-warehouse', warehouseController.addBillWarehouseController);
router.get('/get-all-bill', warehouseController.getAllBillController);


module.exports = router;