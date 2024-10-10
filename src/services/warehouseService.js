const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Unit = require('../models/Unit');
const SupplierOrderHeader = require('../models/SupplierOrder_Header');
const SupplierOrderDetail = require('../models/SupplierOrder_Detail');
const TransactionInventory = require('../models/TransactionInventory');

const { validStatuses } = require('../utils/MappingStatus');
const { sendOrderEmail } = require('./emailService');

function getWarehouseStatus(stockQuantity, minStockThreshold) {
    const buffer = 10; // Khoảng để xác định trạng thái "Gần ngưỡng"

    if (stockQuantity < minStockThreshold) {
        return 'Hết hàng';
    } else if (stockQuantity <= minStockThreshold + buffer) {
        return 'Ít hàng';
    } else {
        return 'Còn hàng';
    }
}

async function getAllWarehouse() {
    try {
        // Tìm tất cả các warehouses
        const warehouses = await Warehouse.find();

        // Sử dụng Promise.all để xử lý đồng thời các warehouse
        const warehousesWithProducts = await Promise.all(warehouses.map(async warehouse => {
            const warehouseObj = warehouse.toObject();

            // Tìm tất cả sản phẩm theo item_code của warehouse
            const products = await Product.find({ item_code: warehouse.item_code }).select('name unit_id supplier_id').lean();

            // Tìm các sản phẩm có unit với quantity = 1
            const productsWithValidUnit = await Promise.all(products.map(async product => {
                if (product.unit_id) {
                    // Tìm unit theo unit_id và kiểm tra quantity = 1
                    const unit = await Unit.findOne({ _id: product.unit_id, quantity: 1 }).lean();
                    if (unit) {
                        // Bỏ các ký tự sau dấu '-' hoặc '/' hoặc '–' trong tên sản phẩm
                        const cleanedName = product.name.split(/[-/–]/)[0].trim();

                        return {
                            ...product,
                            name: cleanedName
                        };
                    }
                }
                return null; // Trả về null nếu không tìm thấy unit phù hợp
            }));

            // Loại bỏ các sản phẩm không có unit phù hợp (null)
            const filteredProducts = productsWithValidUnit.filter(product => product !== null);

            // Lọc ra sản phẩm trùng tên, chỉ giữ lại sản phẩm đầu tiên
            const uniqueProducts = {};
            const seenNames = new Set();

            filteredProducts.forEach(product => {
                if (!seenNames.has(product.name)) {
                    seenNames.add(product.name);
                    uniqueProducts[product.name] = product;
                }
            });

            // Lấy sản phẩm đầu tiên từ uniqueProducts (nếu có)
            const productObject = Object.values(uniqueProducts)[0] || null;

            // Tính toán status dựa trên stock_quantity và min_stock_threshold
            const status = getWarehouseStatus(warehouseObj.stock_quantity, warehouseObj.min_stock_threshold);

            // Trả về đối tượng bao gồm thông tin warehouse và sản phẩm phù hợp
            return {
                ...warehouseObj,
                product: productObject,
                status: status
            };
        }));

        return warehousesWithProducts;
    } catch (err) {
        throw new Error(`Error getting warehouses with products: ${err.message}`);
    }
}


const getAllOrders = async () => {
    try {
        const orders = await SupplierOrderHeader.find().populate('supplier_id', 'name').lean();

        // Lấy thông tin nhân viên và chuyển đổi trạng thái của từng đơn hàng
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            const employee = await Employee.findOne({ account_id: order.account_id }).select('name phone email');
            const orderDetails = await SupplierOrderDetail.find({ supplierOrderHeader_id: order._id }).lean();

            // Lấy tên sản phẩm dựa vào product_id
            const productsWithNames = await Promise.all(orderDetails.flatMap(detail => detail.products.map(async (product) => {
                const productInfo = await Product.findById(product.product_id).select('name').lean();
                return {
                    product_id: product.product_id,
                    name: productInfo ? productInfo.name : null,
                    quantity: product.quantity,
                    price: product.price_order
                };
            })));

            return {
                ...order,
                status: order.status,
                employee: employee ? {
                    name: employee.name,
                    phone: employee.phone,
                    email: employee.email
                } : null,
                total: orderDetails.reduce((sum, detail) => sum + detail.total, 0),
                products: productsWithNames
            };
        }));

        return ordersWithDetails;
    } catch (error) {
        throw new Error(`Error getting all orders: ${error.message}`);
    }
};


const orderProductFromSupplier = async (supplierId, accountId, productList) => {
    const session = await mongoose.startSession();
    let transactionCommitted = false;

    try {
        session.startTransaction();

        const supplier = await Supplier.findById(supplierId).select('email name');
        const employee = await Employee.findOne({ account_id: accountId }).select('name phone email');

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
            status: 'Đang chờ xử lý'
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


const updateOrderStatus = async (orderId, newStatus, products) => {
    try {
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

        // Nếu trạng thái mới là "Đã giao hàng", tạo giao dịch kho hàng
        if (newStatus === 'Đã giao hàng') {
            const inventoryTransactions = products.map(product => ({
                product_id: product.product_id,
                quantity: product.quantity,
                type: 'Nhập hàng',
                order_id: orderId,
                status: false
            }));

            // Lưu các giao dịch kho hàng vào cơ sở dữ liệu
            await TransactionInventory.insertMany(inventoryTransactions);
        }

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
    getAllOrders,
    orderProductFromSupplier,
    updateOrderStatus,
};