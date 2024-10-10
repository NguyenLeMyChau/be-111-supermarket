const Cart = require('../models/Cart');
const Product = require('../models/Product');

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

module.exports = {
    getCartById,
    addProductToCart,
}

