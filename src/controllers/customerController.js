const { addProductToCart, getCartById } = require("../services/customerService");


async function getCartByIdController(req, res) {
    try {
        const { accountId } = req.body;
        const cart = await getCartById(accountId);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error get cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function addProductToCartController(req, res) {
    try {
        const { accountId, productId, quantity, price } = req.body;
        const cart = await addProductToCart(accountId, productId, quantity, price);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error add product to cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getCartByIdController,
    addProductToCartController,
};