const mongoose = require('mongoose');
const Account = require('../models/Account');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const TransactionInventory = require('../models/TransactionInventory');
const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');

async function getCartById(accountId) {
    try {
        const cart = await Cart.findOne({ account_id: accountId });
        const products = cart.products;

        // Lấy thông tin sản phẩm từ product_id
        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const productInfo = await Product.findById(product.product_id).select('name img').lean();
            return {
                product_id: product.product_id,
                name: productInfo ? productInfo.name : null,
                img: productInfo ? productInfo.img : null,
                quantity: product.quantity,
                price: product.price
            };
        }));
        return productsWithDetails;
    } catch (err) {
        throw new Error(`Error getting cart: ${err.message}`);
    }
}

async function addProductToCart(accountId, productId, quantity, price) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
        if (!cart) {
            cart = new Cart({ account_id: accountId, products: [] });
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId);

        if (productIndex > -1) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng sản phẩm và giá
            cart.products[productIndex].quantity += quantity;
            cart.products[productIndex].price = price;
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm sản phẩm mới vào giỏ hàng
            cart.products.push({ product_id: productId, quantity: quantity, price: price });
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

async function payCart(customerId, products, staffId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Tính tổng giá trị của giỏ hàng
        let totalAmount = 0;
        for (const item of products) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) {
                throw new Error(`Product with id ${item.product_id} not found`);
            }
            totalAmount += product.price * item.quantity;
        }

        const invoiceSaleHeader = new InvoiceSaleHeader({
            customer_id: customerId,
            staff_id: staffId ? staffId : null,
        });
        await invoiceSaleHeader.save({ session });

        // Cập nhật số lượng sản phẩm trong kho và lưu thông tin
        for (const item of products) {
            // Lưu thông tin InvoiceSale
            const invoiceSaleDetail = new InvoiceSaleDetail({
                invoiceSaleHeader_id: invoiceSaleHeader._id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            });
            await invoiceSaleDetail.save({ session });

            // Lưu thông tin TransactionInventory
            const transactionInventory = new TransactionInventory({
                product_id: item.product_id,
                quantity: item.quantity,
                type: 'Bán hàng',
                status: true
            });
            await transactionInventory.save({ session });

        }

        await removeAllProductInCart(customerId);

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

module.exports = {
    getCartById,
    addProductToCart,
    payCart,
    updateCart,
    removeProductCart
}

