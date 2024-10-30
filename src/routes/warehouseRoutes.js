const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const router = express.Router();


router.get('/get-warehouses', warehouseController.getWarehouses);
router.get('/get-all-orders', warehouseController.getAllOrdersController);
router.post('/order-product-from-supplier', warehouseController.orderProductFromSupplierController);
router.put('/update-order-status', warehouseController.updateOrderStatusController);
router.post('/add-bill-warehouse', warehouseController.addBillWarehouseController);
router.get('/get-all-bill', warehouseController.getAllBillController);
router.put('/update-bill', warehouseController.updateBillController);
router.get('/get-all-transaction', warehouseController.getAllTransactionController);
router.put('/cancel-bill', warehouseController.cancelBillController);
router.post('/add-stocktaking', warehouseController.addStocktakingController);
router.get('/get-all-stocktaking', warehouseController.getAllStocktakingController);
module.exports = router;