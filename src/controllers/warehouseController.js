const { getAllWarehouse, getProductsByWarehouse, orderProductFromSupplier, updateOrderStatus } = require("../services/warehouseService");


async function getWarehouses(req, res) {
    try {
        const warehouses = await getAllWarehouse();
        res.status(200).json(warehouses);
    } catch (error) {
        console.error(`Error get warehouses: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getProductByWarehouse(req, res) {
    try {
        const warehouseId = req.params.warehouseId;
        const products = await getProductsByWarehouse(warehouseId);
        res.status(200).json(products);
    } catch (error) {
        console.error(`Error get products by warehouse: ${error.message}`);
        res.status(400).json({ message: error.message });
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
        const { orderId, newStatusInVietnamese } = req.body;
        const result = await updateOrderStatus(orderId, newStatusInVietnamese);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getWarehouses,
    getProductByWarehouse,
    orderProductFromSupplierController,
    updateOrderStatusController
};