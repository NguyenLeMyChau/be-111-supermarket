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
                    const supplier = await Supplier.findById(product.supplier_id).select('name').lean();
                    if (unit) {
                        // Bỏ các ký tự sau dấu '-' hoặc '/' hoặc '–' trong tên sản phẩm
                        const cleanedName = product.name.split(/[-/–]/)[0].trim();

                        return {
                            ...product,
                            name: cleanedName,
                            supplier_name: supplier ? supplier.name : null,
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

const addBillWarehouse = async (supplierId, accountId, billId, productList) => {

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
            supplier_id: supplierId,
            account_id: accountId,
            bill_id: billId,
        });

        const savedOrderHeader = await supplierOrderHeader.save({ session });

        // Khởi tạo mảng products để lưu tất cả sản phẩm
        const productsToSave = [];

        for (const product of productList) {
            const productFind = await Product.findOne({ unit_id: product.unit_id, item_code: product.item_code }).lean();

            if (!productFind) {
                throw new Error(`Không tìm thấy sản phẩm cho unit_id: ${product.unit_id} và item_code: ${product.item_code}`);
            }

            // Đẩy từng sản phẩm vào mảng products
            productsToSave.push({
                product_id: productFind._id,
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
            const productFind = await Product.findOne({ unit_id: product.unit_id, item_code: product.item_code }).lean();

            const transactionInventory = new TransactionInventory({
                product_id: productFind._id,
                quantity: product.quantity,
                type: 'Nhập hàng',
                order_id: savedOrderHeader._id,
            });

            await transactionInventory.save({ session });
        }

        //Cập nhật số lượng trong kho
        for (const product of productList) {
            const unit = await Unit.findById(product.unit_id).session(session); // Sử dụng session cho findById
            const conversionFactor = unit.quantity || 1;

            // Tìm warehouse bằng item_code, có session
            const warehouse = await Warehouse.findOne({ item_code: product.item_code }).session(session);

            // Tính số lượng cần cập nhật (quantity * conversionFactor)
            const quantityToAdd = product.quantity * conversionFactor;

            console.log('Số lượng cập nhật:', quantityToAdd);

            // Cập nhật số lượng trong kho
            console.log(`Trước cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);
            warehouse.stock_quantity += quantityToAdd;
            console.log(`Sau cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);

            await warehouse.save({ session });
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
        const orders = await SupplierOrderHeader.find().populate('supplier_id', 'name').lean();

        // Lấy thông tin nhân viên và chuyển đổi trạng thái của từng đơn hàng
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            const employee = await Employee.findOne({ account_id: order.account_id }).select('name phone email');
            const orderDetails = await SupplierOrderDetail.find({ supplierOrderHeader_id: order._id }).lean();

            // Lấy tên sản phẩm dựa vào product_id
            const productsWithNames = await Promise.all(orderDetails.flatMap(detail => detail.products.map(async (product) => {
                const productInfo = await Product.findById(product.product_id).select('name item_code unit_id').lean();

                let unitName = null;
                if (productInfo && productInfo.unit_id) {
                    const unitInfo = await Unit.findById(productInfo.unit_id).select('description').lean();
                    unitName = unitInfo ? unitInfo.description : null;
                }

                return {
                    product_id: product.product_id,
                    name: productInfo ? productInfo.name : null,
                    item_code: productInfo ? productInfo.item_code : null,
                    unit_id: productInfo ? productInfo.unit_id : null,
                    unit_name: unitName,
                    quantity: product.quantity,
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

        // Cập nhật chi tiết đơn hàng với danh sách sản phẩm mới
        details.set({ products: productList });
        await details.save();

        // Bước 3: Cập nhật Warehouse và TransactionInventory
        for (const product of productList) {
            const unit = await Unit.findById(product.unit_id).session(session);
            const conversionFactor = unit.quantity || 1;

            // Tìm warehouse hiện tại
            const warehouse = await Warehouse.findOne({ item_code: product.item_code }).session(session);
            if (!warehouse) {
                throw new Error(`Không tìm thấy kho với item_code: ${product.item_code}`);
            }

            // Tìm giao dịch cũ trong TransactionInventory dựa vào product_id và oldBillId
            const existingTransaction = await TransactionInventory.findOne({
                product_id: product.product_id,
                order_id: header._id // Dựa theo _id của header
            }).session(session);

            if (existingTransaction) {
                // Tính lại số lượng cũ (đã nhân với conversionFactor trước đó)
                const oldQuantity = existingTransaction.quantity * conversionFactor;

                // Trừ số lượng cũ ra khỏi kho
                warehouse.stock_quantity -= oldQuantity;
            }

            // Tính số lượng mới cần thêm vào kho
            const newQuantity = product.quantity * conversionFactor;

            // Cộng số lượng mới vào kho
            warehouse.stock_quantity += newQuantity;

            // Lưu cập nhật kho
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



module.exports = {
    getAllWarehouse,
    getAllOrders,
    orderProductFromSupplier,
    updateOrderStatus,
    addBillWarehouse,
    getAllBill,
    updateBill
};