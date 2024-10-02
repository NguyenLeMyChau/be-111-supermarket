const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

async function getAllWarehouse() {
    try {
        // Tìm tất cả các kho hàng và điền thông tin sản phẩm tương ứng
        const warehouses = await Warehouse.find().populate('product_id', 'name');

        // Chuyển đổi dữ liệu để chỉ lấy tên sản phẩm và thêm thuộc tính status
        const warehousesWithProductNames = warehouses.map(warehouse => {
            const warehouseObj = warehouse.toObject();
            return {
                ...warehouseObj,
                productName: warehouseObj.product_id ? warehouseObj.product_id.name : null,
                product_id: undefined, // Loại bỏ product_id
                status: warehouseObj.stock_quantity > warehouseObj.min_stock_threshold
            };
        });

        return warehousesWithProductNames;
    } catch (err) {
        throw new Error(`Error getting all warehouses: ${err.message}`);
    }
}

module.exports = {
    getAllWarehouse
};