const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

async function getAllWarehouse() {
    try {
        const warehouses = await Warehouse.find().populate('product_id', 'name');

        const warehousesWithProductNames = warehouses.map(warehouse => {
            const warehouseObj = warehouse.toObject();
            return {
                ...warehouseObj,
                product_name: warehouseObj.product_id ? warehouseObj.product_id.name : null,
                product_id: undefined,
                status: warehouseObj.stock_quantity > warehouseObj.min_stock_threshold
            };
        });

        return warehousesWithProductNames;
    } catch (err) {
        throw new Error(`Error getting all warehouses: ${err.message}`);
    }
}

// Lấy tất cả sản phẩm cùng nhà cung cấp với warehouse
async function getProductsByWarehouse(warehouseId) {
    try {
        const warehouse = await Warehouse.findById(warehouseId).select('product_id');
        const product = await Product.findById(warehouse.product_id).select('supplier_id');
        const products = await Product.find({ supplier_id: product.supplier_id }).select('name');
        const warehouses = await Warehouse.find({ product_id: { $in: products.map(product => product._id) } });
        const supplier = await Supplier.findById(product.supplier_id).select('name');

        const warehousesWithProductNames = await Promise.all(warehouses.map(async warehouse => {
            const warehouseObj = warehouse.toObject();
            const product = await Product.findById(warehouse.product_id).select('name').lean();

            return {
                ...warehouseObj,
                product_name: product ? product.name : null,
                supplier_id: supplier._id,
                supplier_name: supplier.name,
                status: warehouseObj.stock_quantity > warehouseObj.min_stock_threshold
            };
        }));

        return warehousesWithProductNames;
    } catch (err) {
        throw new Error(`Error getting products by warehouse: ${err.message}`);
    }
}


module.exports = {
    getAllWarehouse,
    getProductsByWarehouse
};