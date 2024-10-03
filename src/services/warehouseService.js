const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const SupplierOrderHeader = require('../models/SupplierOrder_Header');
const SupplierOrderDetail = require('../models/SupplierOrder_Detail');
const { mapVietnameseStatusToValidStatus, validStatuses } = require('../utils/MappingStatus');

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
        const supplier = await Supplier.findById(product.supplier_id).select('name email');

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


const orderProductFromSupplier = async (supplierId, accountId, productList) => {
    // Bắt đầu một session
    const session = await mongoose.startSession();

    try {
        // Bắt đầu transaction
        session.startTransaction();

        // 1. Tạo một bản ghi mới cho SupplierOrderHeader trong session
        const supplierOrderHeader = new SupplierOrderHeader({
            supplier_id: supplierId,
            account_id: accountId,
            status: 'PENDING'
        });

        // Lưu SupplierOrderHeader vào database trong session
        const savedOrderHeader = await supplierOrderHeader.save({ session });

        // 2. Tính toán tổng tiền của đơn hàng từ danh sách sản phẩm
        const totalAmount = productList.reduce((sum, product) => {
            return sum + product.quantity * product.price_order;
        }, 0);

        // 3. Tạo bản ghi SupplierOrderDetail tương ứng với header trong session
        const supplierOrderDetail = new SupplierOrderDetail({
            supplierOrderHeader_id: savedOrderHeader._id, // Liên kết đến SupplierOrderHeader
            products: productList.map(product => ({
                product_id: product.product_id,
                quantity: product.quantity,
                price_order: product.price_order
            })),
            total: totalAmount // Tổng tiền cho tất cả sản phẩm
        });

        // Lưu SupplierOrderDetail vào database trong session
        const savedOrderDetail = await supplierOrderDetail.save({ session });

        // 4. Commit transaction nếu không có lỗi
        await session.commitTransaction();

        console.log('Order placed successfully!');
        return {
            orderHeader: savedOrderHeader,
            orderDetail: savedOrderDetail
        };
    } catch (error) {
        // Nếu có lỗi, rollback lại toàn bộ transaction
        await session.abortTransaction();
        console.error('Error placing order, transaction rolled back:', error);
        throw error;
    } finally {
        // Kết thúc session
        session.endSession();
    }
};


const updateOrderStatus = async (orderId, newStatusInVietnamese) => {
    try {
        // Chuyển đổi trạng thái tiếng Việt sang trạng thái hợp lệ
        const newStatus = mapVietnameseStatusToValidStatus(newStatusInVietnamese);

        // Kiểm tra trạng thái mới có hợp lệ không
        if (!validStatuses.includes(newStatus)) {
            throw new Error('Trạng thái không hợp lệ');
        }

        // Tìm đơn hàng theo orderId
        const order = await SupplierOrderHeader.findById(orderId);

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        // Cập nhật trạng thái mới
        order.status = newStatus;
        await order.save();

        // Trả về đối tượng đơn hàng đã cập nhật
        return {
            message: 'Cập nhật trạng thái đơn hàng thành công',
            order: {
                id: order._id,
                status: order.status,
            },
        };
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        throw new Error('Đã xảy ra lỗi khi cập nhật trạng thái');
    }
};


module.exports = {
    getAllWarehouse,
    getProductsByWarehouse,
    orderProductFromSupplier,
    updateOrderStatus
};