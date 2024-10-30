const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Unit = require('../models/Unit');
const SupplierOrderHeader = require('../models/SupplierOrder_Header');
const SupplierOrderDetail = require('../models/SupplierOrder_Detail');
const TransactionInventory = require('../models/TransactionInventory');
const StocktakingHeader = require('../models/Stocktaking_Header');
const StocktakingDetail = require('../models/Stocktaking_Detail');


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
            const products = await Product.findOne({ item_code: warehouse.item_code }).select('name unit_convert').lean();

            const unit = await Unit.findById(warehouse.unit_id).select('description').lean();

            let unitBasic = null;

            if (products && Array.isArray(products.unit_convert)) {
                for (const unitData of products.unit_convert) {
                    // Kiểm tra nếu là đơn vị cơ bản và tính số lượng
                    if (unitData?.checkBaseUnit) {
                        unitBasic = await Unit.findById(unitData.unit).select('description').lean();
                    }
                }
            }

            // Trả về đối tượng bao gồm thông tin warehouse và sản phẩm phù hợp
            return {
                ...warehouseObj,
                product: products ? products.name : null,
                unit: unit ? unit : null,
                unitBasic: unitBasic ? unitBasic : null,
                unit_convert: products ? products.unit_convert : null,
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
                    price: product.price_order,
                    total: product.quantity * product.price_order
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

const addBillWarehouse = async (accountId, billId, description, productList) => {

    const session = await mongoose.startSession();
    let transactionCommitted = false;

    try {
        session.startTransaction();

        // Kiểm tra xem billId đã tồn tại hay chưa
        const existingOrder = await SupplierOrderHeader.findOne({ bill_id: billId }).session(session);
        if (existingOrder) {
            throw new Error('Mã phiếu nhập kho đã tồn tại. Vui lòng kiểm tra lại');
        }

        const supplierOrderHeader = new SupplierOrderHeader({
            account_id: accountId,
            bill_id: billId,
            description: description
        });

        const savedOrderHeader = await supplierOrderHeader.save({ session });

        // Khởi tạo mảng products để lưu tất cả sản phẩm
        const productsToSave = [];

        for (const product of productList) {

            // Đẩy từng sản phẩm vào mảng products
            productsToSave.push({
                product_id: product.product_id,
                unit_id: product.unit_id,
                quantity: product.quantity,
            });
        }

        // Tạo đối tượng SupplierOrderDetail với mảng products
        const supplierOrderDetail = new SupplierOrderDetail({
            supplierOrderHeader_id: savedOrderHeader._id,
            products: productsToSave,  // Đẩy toàn bộ mảng products vào đây
        });

        const savedOrderDetails = await supplierOrderDetail.save({ session });


        // Tạo và lưu TransactionInventory cho mỗi sản phẩm
        for (const product of productList) {

            const transactionInventory = new TransactionInventory({
                product_id: product.product_id,
                quantity: product.quantity,
                unit_id: product.unit_id,
                type: 'Nhập hàng',
                order_id: savedOrderHeader._id,
            });

            await transactionInventory.save({ session });
        }

        //Cập nhật số lượng trong kho
        for (const product of productList) {

            const existingUnitWarehouse = await Warehouse.findOne({ item_code: product.item_code, unit_id: product.unit_id }).session(session);

            if (existingUnitWarehouse) {
                existingUnitWarehouse.stock_quantity += product.quantity;
                await existingUnitWarehouse.save({ session });
            }

        }

        await session.commitTransaction();
        transactionCommitted = true;

        return {
            orderHeader: savedOrderHeader,
            orderDetail: savedOrderDetails
        };
    } catch (error) {
        if (!transactionCommitted) {
            await session.abortTransaction();
        }
        console.error('Error placing order, transaction rolled back:', error);
        throw new Error(`${error.message}`);
    } finally {
        session.endSession();
    }
};

const getAllBill = async () => {
    try {
        const orders = await SupplierOrderHeader.find().lean();

        // Lấy thông tin nhân viên và chuyển đổi trạng thái của từng đơn hàng
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            const employee = await Employee.findOne({ account_id: order.account_id }).select('name phone email');
            const orderDetails = await SupplierOrderDetail.find({ supplierOrderHeader_id: order._id }).lean();

            // Lấy tên sản phẩm dựa vào product_id
            const productsWithNames = await Promise.all(orderDetails.flatMap(detail => detail.products.map(async (product) => {
                const productInfo = await Product.findById(product.product_id).select('name item_code unit_convert').lean();

                const unit = await Unit.findById(product.unit_id).select('description').lean();

                return {
                    product_id: product.product_id,
                    name: productInfo ? productInfo.name : null,
                    item_code: productInfo ? productInfo.item_code : null,
                    quantity: product.quantity,
                    unit_name: unit ? unit : null,
                };
            })));

            return {
                ...order,
                employee: employee ? {
                    name: employee.name,
                    phone: employee.phone,
                    email: employee.email
                } : null,
                products: productsWithNames
            };
        }));

        return ordersWithDetails;
    } catch (error) {
        throw new Error(`Error getting all bill: ${error.message}`);
    }
};

const updateBill = async (oldBillId, newBillId, productList) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // Bước 0: Kiểm tra xem newBillId đã tồn tại trong db hay chưa, nếu oldBillId !== newBillId
        if (oldBillId !== newBillId) {
            const existingNewBill = await SupplierOrderHeader.findOne({ bill_id: newBillId }).session(session);
            if (existingNewBill) {
                throw new Error('Mã phiếu nhập này đã tồn tại.');
            }
        }

        // Bước 1: Tìm và cập nhật SupplierOrderHeader bằng oldBillId
        const header = await SupplierOrderHeader.findOne({ bill_id: oldBillId }).session(session);

        if (!header) {
            throw new Error('Không tìm thấy đơn hàng với mã oldBillId này.');
        }

        // Cập nhật bill_id thành newBillId
        header.set({ bill_id: newBillId });

        // Lưu cập nhật cho SupplierOrderHeader
        await header.save();

        // Bước 2: Tìm và cập nhật SupplierOrderDetail theo supplierOrderHeader_id
        const details = await SupplierOrderDetail.findOne({ supplierOrderHeader_id: header._id }).session(session);
        if (!details) {
            throw new Error('Không tìm thấy chi tiết đơn hàng cho oldBillId này.');
        }

        // Chuyển đổi unit_name thành unit_id trong productList
        const updatedProductList = productList.map(product => {
            if (product.unit_name && product.unit_name._id) {
                return {
                    ...product,
                    unit_id: product.unit_name._id,
                    unit_name: undefined // Loại bỏ unit_name nếu không cần thiết
                };
            }
            return product;
        });
        // Cập nhật chi tiết đơn hàng với danh sách sản phẩm mới
        details.set({ products: updatedProductList });
        await details.save();

        // Bước 3: Cập nhật Warehouse và TransactionInventory
        for (const product of productList) {

            // Tìm warehouse hiện tại
            const warehouse = await Warehouse.findOne({ item_code: product.item_code, unit_id: product.unit_name._id }).session(session);

            // Tìm giao dịch cũ trong TransactionInventory dựa vào product_id và oldBillId
            const existingTransaction = await TransactionInventory.findOne({
                product_id: product.product_id,
                unit_id: product.unit_name._id,
                order_id: header._id
            }).session(session);

            // Lưu cập nhật kho
            warehouse.stock_quantity -= existingTransaction.quantity;
            warehouse.stock_quantity += product.quantity;
            await warehouse.save({ session });

            // Nếu đã có transaction cũ thì cập nhật, nếu chưa thì tạo mới
            if (existingTransaction) {
                existingTransaction.quantity = product.quantity;
                await existingTransaction.save({ session });
            } else {
                const newTransaction = new TransactionInventory({
                    product_id: product.product_id,
                    quantity: product.quantity,
                    type: 'Nhập hàng',
                    order_id: header._id, // Dùng _id mới từ header
                });
                await newTransaction.save({ session });
            }
        }

        // Commit transaction nếu không có lỗi
        await session.commitTransaction();
        session.endSession();

        return { message: 'Cập nhật đơn hàng thành công' };

    } catch (error) {
        // Rollback transaction nếu có lỗi
        await session.abortTransaction();
        session.endSession();
        throw new Error(`Có lỗi xảy ra khi cập nhật đơn hàng: ${error.message}`);
    }
};

const cancelBill = async (billId, cancel_reason) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Step 1: Find SupplierOrderHeader by billId and update status to false
        const header = await SupplierOrderHeader.findOne({ _id: billId }).session(session);
        if (!header) {
            throw new Error('Không tìm thấy đơn hàng với mã billId này.');
        }
        header.status = false;
        header.cancel_reason = cancel_reason; // Thêm cancel_reason vào header
        await header.save({ session });

        // Step 2: Find SupplierOrderDetail by supplierOrderHeader_id
        const details = await SupplierOrderDetail.findOne({ supplierOrderHeader_id: header._id }).session(session);
        if (!details) {
            throw new Error('Không tìm thấy chi tiết đơn hàng cho billId này.');
        }

        // Step 3: Update Warehouse and create new TransactionInventory
        for (const product of details.products) {

            const productFind = await Product.findById(product.product_id).lean();

            const warehouse = await Warehouse.findOne({ item_code: productFind.item_code, unit_id: product.unit_id }).session(session);
            if (!warehouse) {
                throw new Error('Không tìm thấy kho hàng cho sản phẩm này.');
            }

            // Update warehouse stock
            warehouse.stock_quantity -= product.quantity;
            await warehouse.save({ session });

            // Create new transaction with type 'Huỷ nhập phiếu'
            const newTransaction = new TransactionInventory({
                product_id: product.product_id,
                unit_id: product.unit_id,
                order_id: header._id,
                quantity: product.quantity,
                type: 'Huỷ phiếu nhập',
            });
            await newTransaction.save({ session });
        }

        // Commit transaction if no errors
        await session.commitTransaction();
        session.endSession();

        return { message: 'Hủy đơn hàng thành công' };

    } catch (error) {
        // Rollback transaction if any error occurs
        await session.abortTransaction();
        session.endSession();
        throw new Error(`Có lỗi xảy ra khi hủy đơn hàng: ${error.message}`);
    }
}

const getAllTransaction = async () => {
    try {
        const transactions = await TransactionInventory.find().lean();
        return transactions;
    } catch (error) {
        throw new Error(`Error getting all transactions: ${error.message}`);
    }
};

const addStocktaking = async (accountId, stocktakingId, reason, productList) => {
    const session = await mongoose.startSession();
    let transactionCommitted = false;

    try {
        session.startTransaction();

        const stocktakingHeader = new StocktakingHeader({
            account_id: accountId,
            stocktaking_id: stocktakingId,
            reason: reason
        });

        const savedStocktakingHeader = await stocktakingHeader.save({ session });

        const stocktakingDetail = new StocktakingDetail({
            stocktakingHeader_id: savedStocktakingHeader._id,
            products: productList.map(product => ({
                product_id: product.product_id,
                unit_id: product.unit_id,
                quantity_stock: product.quantity_stock,
                quantity_actual: product.quantity_actual
            }))
        });

        const savedStocktakingDetail = await stocktakingDetail.save({ session });

        // Cập nhật stock_quantity trong warehouse
        for (const product of productList) {
            const warehouseItem = await Warehouse.findOne({
                item_code: product.item_code,
                unit_id: product.unit_id
            }).session(session);

            if (warehouseItem) {
                warehouseItem.stock_quantity = product.quantity_actual;
                await warehouseItem.save({ session });

                // Tạo giao dịch ghi nhận
                const transaction = new TransactionInventory({
                    product_id: product.product_id,
                    unit_id: product.unit_id,
                    quantity: product.quantity_actual,
                    type: 'Kiểm kê kho',
                    stocktaking_id: savedStocktakingHeader._id,
                });

                await transaction.save({ session });
            } else {
                throw new Error(`Không tìm thấy sản phẩm với item_code: ${product.item_code} và unit_id: ${product.unit_id}`);
            }
        }

        await session.commitTransaction();
        transactionCommitted = true;

        console.log('Stocktaking added successfully!');

        return {
            stocktakingHeader: savedStocktakingHeader,
            stocktakingDetail: savedStocktakingDetail
        };
    } catch (error) {
        if (!transactionCommitted) {
            await session.abortTransaction();
        }
        console.error('Error adding stocktaking, transaction rolled back:', error);
        throw new Error(`${error.message}`);
    } finally {
        session.endSession();
    }
}



module.exports = {
    getAllWarehouse,
    getAllOrders,
    orderProductFromSupplier,
    updateOrderStatus,
    addBillWarehouse,
    getAllBill,
    updateBill,
    cancelBill,
    getAllTransaction,
    addStocktaking
};