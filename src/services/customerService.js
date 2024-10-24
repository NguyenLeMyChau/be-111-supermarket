const mongoose = require('mongoose');
const Account = require('../models/Account');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const TransactionInventory = require('../models/TransactionInventory');
const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const promotionService = require('./promotionService');
const Warehouse = require('../models/Warehouse');
const ProductPrice_Detail = require('../models/ProductPrice_Detail')
const PromotionDetail = require('../models/Promotion_Detail');
const PromotionLine = require('../models/Promotion_Line');

async function getCartById(accountId) {
    try {
        const cart = await Cart.findOne({ account_id: accountId });
        const products = cart.products;

        // Lấy thông tin sản phẩm từ product_id
        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const productInfo = await Product.findById(product.product_id).select('name img unit_id item_code').lean();

            const unitInfo = productInfo ? await Unit.findById(productInfo.unit_id).lean() : null;

            const priceInfo = await ProductPrice_Detail.findOne({ product_id: product.product_id }).populate({
                path: "productPriceHeader_id",
                match: { status: "active" }, // Only include active ProductPriceHeader
            }) || 0;
            return {
                product_id: product.product_id,
                name: productInfo ? productInfo.name : null,
                item_code: productInfo ? productInfo.item_code : null,
                img: productInfo ? productInfo.img : null,
                quantity: product.quantity,
                price: priceInfo.price,
                unit: unitInfo,
                total: product.total,
            };
        }));
        return productsWithDetails;
    } catch (err) {
        throw new Error(`Error getting cart: ${err.message}`);
    }
}

async function addProductToCart(accountId, productId, quantity, total) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });
        let priceInfo = await ProductPrice_Detail.findOne({ product_id: productId }).populate({
            path: "productPriceHeader_id",
            match: { status: "active" }, // Only include active ProductPriceHeader
        });
        // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
        if (!cart) {
            cart = new Cart({ account_id: accountId, products: [] });
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId);

        if (productIndex > -1) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng sản phẩm và giá
            cart.products[productIndex].quantity += quantity;
            cart.products[productIndex].price = priceInfo._id;
            cart.products[productIndex].total = total;
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm sản phẩm mới vào giỏ hàng
            cart.products.push({ product_id: productId, quantity: quantity, price: priceInfo._id, total: total });
        }

        // Lưu giỏ hàng
        await cart.save();

        return cart;
    } catch (err) {
        throw new Error(`Error adding product to cart: ${err.message}`);
    }
}

async function updateCart(accountId, productList) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Duyệt qua danh sách sản phẩm và cập nhật giá
        for (let product of productList) {
            // Tìm giá theo product._id từ ProductPrice_Detail
            let priceInfo = await ProductPrice_Detail.findOne({ product_id: product.product_id }).populate({
                path: "productPriceHeader_id",
                match: { status: "active" }, // Only include active ProductPriceHeader
            });
            if (priceInfo) {
                // Gán lại giá cho sản phẩm
                product.price = priceInfo._id;
            }
        }
        // Cập nhật giỏ hàng
        cart.products = productList;

        // Lưu giỏ hàng
        await cart.save();

        return cart;

    } catch (err) {
        throw new Error(`Error updating cart: ${err.message}`);
    }
}

async function removeAllProductInCart(accountId) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Xóa toàn bộ sản phẩm trong giỏ hàng
        cart.products = [];

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'All products removed from cart' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function payCart(customerId, products, paymentMethod, paymentInfo, paymentAmount) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Tính tổng giá trị của giỏ hàng
        // let totalAmount = amount;
        // for (const item of products) {
        //     const product = await Product.findById(item.product_id).session(session);
        //     if (!product) {
        //         throw new Error(`Product with id ${item.product_id} not found`);
        //     }
        //     totalAmount += product.price * item.quantity;
        // }

        const invoiceSaleHeader = new InvoiceSaleHeader({
            customer_id: customerId,
            paymentInfo: paymentInfo,
            paymentMethod: paymentMethod,
            paymentAmount: paymentAmount,
        });
        await invoiceSaleHeader.save({ session });

        // Cập nhật số lượng sản phẩm trong kho và lưu thông tin
        const invoiceSaleDetails = [];

        for (const product of products) {
            // Lấy thông tin khuyến mãi cho từng sản phẩm
            const promotions = await promotionService.getPromotionByProductId(product.product_id); // Thay đổi để lấy theo ID sản phẩm

            const invoiceSaleDetail = {
                product: product.product_id, // ID sản phẩm
                quantity: product.quantity, // Số lượng
                price: product.price, // ID giá sản phẩm
                promotion: promotions.length > 0 ? promotions[0]._id : null // ID khuyến mãi nếu có
            };

            invoiceSaleDetails.push(invoiceSaleDetail);
        }

        // Lưu thông tin hóa đơn bán hàng chi tiết
        const newInvoiceSaleDetail = new InvoiceSaleDetail({
            invoiceSaleHeader_id: invoiceSaleHeader._id,
            products: invoiceSaleDetails,
        });

        await newInvoiceSaleDetail.save({ session });

        for (const item of products) {
            const transactionInventory = new TransactionInventory({
                product_id: item.product_id,
                quantity: item.quantity,
                type: 'Bán hàng',
            });
            await transactionInventory.save({ session });

        }

        await removeAllProductInCart(customerId);

        for (const product of products) {
            const pro = await Product.findById(product.product_id).session(session);
            const unit = await Unit.findById(pro.unit_id).session(session);
            console.log(pro, unit) // Sử dụng session cho findById
            const conversionFactor = unit.quantity || 1;

            // Tìm warehouse bằng item_code, có session
            const warehouse = await Warehouse.findOne({ item_code: pro.item_code }).session(session);

            // Tính số lượng cần cập nhật (quantity * conversionFactor)
            const quantityToAdd = product.quantity * conversionFactor;

            console.log('Số lượng cập nhật:', quantityToAdd);

            // Cập nhật số lượng trong kho
            console.log(`Trước cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);
            warehouse.stock_quantity -= quantityToAdd;
            console.log(`Sau cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);

            await warehouse.save({ session });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return { success: true, message: 'Payment successful' };
    } catch (error) {
        // Rollback transaction
        await session.abortTransaction();
        session.endSession();

        return { success: false, message: error.message };
    }
}

const removeProductCart = async (accountId, productId) => {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Xóa sản phẩm trong giỏ hàng
        cart.products = cart.products.filter(p => p.product_id.toString() !== productId);

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'Product removed from cart' };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
}
const updateProductCart = async (accountId, productId, quantity) => {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Cập nhật số lượng sản phẩm trong giỏ hàng
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId);

        if (productIndex > -1) {
            cart.products[productIndex].quantity = quantity;
        }

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'Product updated in cart' };

    } catch (error) {
        return { success: false, message: error.message };
    }
}

const updateCustomerInfo = async (accountId, userData) => {
    try {
        const account = await Account.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Cập nhật thông tin người dùng, không bao gồm trường phone
        const { phone, ...userDataToUpdate } = userData; // Loại bỏ phone ra khỏi userData
        const userUpdated = await Customer.findOneAndUpdate(
            { account_id: accountId },
            { $set: userDataToUpdate },  // Cập nhật thông tin khác
            { new: true }
        );

        return userUpdated;
    } catch (error) {
        throw new Error('Error updating user: ' + error.message);
    }
}

const getInvoicesByAccountId = async (accountId) => {
    try {
        // Tìm tất cả các hóa đơn của tài khoản
        const invoicesHeader = await InvoiceSaleHeader.find({ customer_id: accountId });

        // Lấy chi tiết hóa đơn và thông tin sản phẩm cho mỗi hóa đơn
        const invoices = await Promise.all(invoicesHeader.map(async (header) => {
            // Tìm chi tiết của hóa đơn (là một object, không phải mảng)
            const detail = await InvoiceSaleDetail.findOne({ invoiceSaleHeader_id: header._id }).lean();
            const customer = await Customer.findOne({ account_id: header.customer_id }).select('name').lean();

            // Duyệt qua products bên trong detail
            const productsWithInfo = await Promise.all(detail.products.map(async (item) => {
                const product = await Product.findById(item.product).select('name img unit_id').lean();
                const unit = await Unit.findById(product.unit_id).select('description').lean();
                const promotionDetail = await PromotionDetail.findOne({ _id: item.promotion }).lean() || {};
                let promotionLine = {};

                // Kiểm tra và xử lý khuyến mãi nếu có
                if (promotionDetail) {
                    promotionLine = await PromotionLine.findOne({ _id: promotionDetail.promotionLine_id }).lean();

                    // Gán promotionDetail vào promotionLine nếu promotionLine tồn tại
                    if (promotionLine) {
                        promotionLine.promotionDetail = promotionDetail;
                    }
                }

                // Tính giá sau khuyến mãi (nếu khuyến mãi là loại "amount")
                let total = 0;
                let discountedPrice = item.price;
                let productBuy = null;
                let productDonate = null;

                if (promotionLine && promotionLine.type === 'amount') {
                    const discountAmount = promotionDetail.amount_donate || 0;
                    const minQuantity = promotionDetail.quantity || 1;
                    if (item.quantity >= minQuantity) {
                        discountedPrice = Math.max(0, item.price - discountAmount);
                        total = item.quantity * discountedPrice;
                    }
                } else if (promotionLine && promotionLine.type === 'quantity') {
                    const minQuantity = promotionDetail.quantity || 1; // Số lượng cần mua
                    const quantityDonate = promotionDetail.quantity_donate || 0; // Số lượng được tặng

                    // Truy vấn thông tin sản phẩm mua và sản phẩm được tặng
                    productBuy = await Product.findOne({ _id: promotionDetail.product_id }).select('name img').populate('unit_id', 'description').lean();
                    productDonate = await Product.findOne({ _id: promotionDetail.product_donate }).select('name img').populate('unit_id', 'description').lean();

                    // Số lượng sản phẩm mà khách hàng cần mua thực tế (không tính số lượng được tặng)
                    const chargeableQuantity = Math.floor(item.quantity / (minQuantity + quantityDonate)) * minQuantity
                        + (item.quantity % (minQuantity + quantityDonate));

                    // Tổng tiền phải trả
                    total = chargeableQuantity * item.price;

                    // Gắn thông tin productBuy và productDonate vào productDetail
                    promotionDetail.productBuy = productBuy;  // Thêm thông tin sản phẩm mua
                    promotionDetail.productDonate = productDonate; // Thêm thông tin sản phẩm tặng
                } else {
                    discountedPrice = 0;
                    total = item.quantity * item.price;
                }

                promotionDetail.discountedPrice = discountedPrice;
                promotionDetail.total = total;

                return {
                    ...item,
                    promotion: promotionLine,
                    total,
                    productName: product ? product.name : 'Unknown',
                    productImg: product ? product.img : null,
                    unitName: unit ? unit.description : 'Unknown'
                };
            }));

            // Trả về thông tin hóa đơn cùng chi tiết và thông tin sản phẩm
            return {
                ...header.toObject(),
                customerName: customer ? customer.name : 'Unknown',
                detail: productsWithInfo
            };
        }));

        return invoices;
    } catch (error) {
        throw new Error('Error getting invoices: ' + error.message);
    }
};

const checkStockQuantityInCart = async (item_code, quantity) => {
    try {
        const warehouse = await Warehouse.findOne({ item_code: item_code });
        if (!warehouse) {
            return { inStock: false, message: `Warehouse with item_code ${item_code} not found` };
        }

        if (warehouse.stock_quantity < quantity) {
            return { inStock: false, message: `Tồn kho không đủ. Số lượng còn lại: ${warehouse.stock_quantity}` };
        }

        return { inStock: true }; // Tồn kho đủ
    } catch (error) {
        throw new Error(`Error checking stock quantity: ${error.message}`);
    }
};

module.exports = {
    getCartById,
    addProductToCart,
    payCart,
    updateCart,
    removeProductCart,
    updateProductCart,
    updateCustomerInfo,
    getInvoicesByAccountId,
    checkStockQuantityInCart,
}

