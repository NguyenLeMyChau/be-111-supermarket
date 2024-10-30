const { getAllWarehouse, getProductsByWarehouse, orderProductFromSupplier, updateOrderStatus, getAllOrders, getWarehousesFromSupplierId, addBillWarehouse, getAllBill, updateBill, getAllTransaction, cancelBill } = require("../services/warehouseService");


async function getWarehouses(req, res) {
    try {
        const warehouses = await getAllWarehouse();
        res.status(200).json(warehouses);
    } catch (error) {
        console.error(`Error get warehouses: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getAllOrdersController(req, res) {
    try {
        const orders = await getAllOrders();
        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function orderProductFromSupplierController(req, res) {
    try {
        // Lấy dữ liệu từ body của request (supplier_id, account_id, và danh sách sản phẩm)
        const { supplierId, accountId, products } = req.body;

        // Kiểm tra xem dữ liệu yêu cầu có đủ không
        if (!supplierId || !accountId || !products || !Array.isArray(products)) {
            return res.status(400).json({ message: 'Invalid input. Please provide supplierId, accountId, and a valid product list.' });
        }

        // Gọi hàm orderProductFromSupplier từ service để tạo đơn hàng
        const orderResult = await orderProductFromSupplier(supplierId, accountId, products);

        // Trả về phản hồi thành công cho client
        return res.status(201).json({
            message: 'Order placed successfully!',
            orderHeader: orderResult.orderHeader,
            orderDetail: orderResult.orderDetail
        });
    } catch (error) {
        // Xử lý lỗi và trả về phản hồi lỗi
        console.error('Error placing order:', error);
        return res.status(500).json({ message: 'Failed to place order', error: error.message });
    }
}

const updateOrderStatusController = async (req, res) => {
    try {
        const { orderId, newStatus, products } = req.body;
        const result = await updateOrderStatus(orderId, newStatus, products);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const addBillWarehouseController = async (req, res) => {
    try {
        const { accountId, billId, description, productList } = req.body;
        const result = await addBillWarehouse(accountId, billId, description, productList);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

async function getAllBillController(req, res) {
    try {
        const bills = await getAllBill();
        return res.status(200).json(bills);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateBillController = async (req, res) => {
    try {
        const { oldBillId, newBillId, productList } = req.body;
        const result = await updateBill(oldBillId, newBillId, productList);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const cancelBillController = async (req, res) => {
    try {
        const { billId, cancel_reason } = req.body;
        const result = await cancelBill(billId, cancel_reason);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllTransactionController = async (req, res) => {
    try {
        const result = await getAllTransaction();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


module.exports = {
    getWarehouses,
    getAllOrdersController,
    orderProductFromSupplierController,
    updateOrderStatusController,
    addBillWarehouseController,
    getAllBillController,
    updateBillController,
    getAllTransactionController,
    cancelBillController
};