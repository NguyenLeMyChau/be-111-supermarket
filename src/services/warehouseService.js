const mongoose = require('mongoose');
const Account = require('../models/Account');
const Employee = require('../models/Employee');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const SupplierOrderHeader = require('../models/SupplierOrder_Header');
const SupplierOrderDetail = require('../models/SupplierOrder_Detail');
const { mapVietnameseStatusToValidStatus, validStatuses } = require('../utils/MappingStatus');
const { sendOrderEmail } = require('./emailService');

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
                supplier_email: supplier.email,
                status: warehouseObj.stock_quantity > warehouseObj.min_stock_threshold
            };
        }));

        return warehousesWithProductNames;
    } catch (err) {
        throw new Error(`Error getting products by warehouse: ${err.message}`);
    }
}


const orderProductFromSupplier = async (supplierId, accountId, productList) => {
    const session = await mongoose.startSession();
    let transactionCommitted = false;

    try {
        session.startTransaction();

        const supplier = await Supplier.findById(supplierId).select('email name');
        const employee = await Employee.findOne({ account_id: accountId }).select('name phone email'); console.log('Employee:', employee);


        // Lấy tên sản phẩm từ productList
        const productsWithNames = await Promise.all(productList.map(async (product) => {
            const productInfo = await Product.findById(product.product_id).select('name');
            return {
                ...product,
                name: productInfo ? productInfo.name : 'Unknown'
            };
        }));

        const supplierOrderHeader = new SupplierOrderHeader({
            supplier_id: supplierId,
            account_id: accountId,
            status: 'PENDING'
        });

        const savedOrderHeader = await supplierOrderHeader.save({ session });

        const totalAmount = productList.reduce((sum, product) => {
            return sum + product.quantity * product.price_order;
        }, 0);

        const supplierOrderDetail = new SupplierOrderDetail({
            supplierOrderHeader_id: savedOrderHeader._id,
            products: productList.map(product => ({
                product_id: product.product_id,
                quantity: product.quantity,
                price_order: product.price_order
            })),
            total: totalAmount
        });

        const savedOrderDetail = await supplierOrderDetail.save({ session });

        await session.commitTransaction();
        transactionCommitted = true;

        console.log('Order placed successfully!');

        const orderInfo = {
            supplierName: supplier.name,
            orderId: savedOrderHeader._id,
            products: productsWithNames,
            total: totalAmount,
            senderName: employee.name,
            senderPhone: employee.phone,
            senderEmail: employee.email,
        };

        await sendOrderEmail(orderInfo);

        return {
            orderHeader: savedOrderHeader,
            orderDetail: savedOrderDetail
        };
    } catch (error) {
        if (!transactionCommitted) {
            await session.abortTransaction();
        }
        console.error('Error placing order, transaction rolled back:', error);
        throw error;
    } finally {
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