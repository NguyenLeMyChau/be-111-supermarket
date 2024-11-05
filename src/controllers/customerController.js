const { addProductToCart, getCartById, payCart, updateCart, removeProductCart, updateProductCart, updateCustomerInfo, getInvoicesByAccountId, checkStockQuantityInCart, getAllPromotionActive ,payCartWeb} = require("../services/customerService");

async function getCartByIdController(req, res) {
    try {
        const accountId = req.query.accountId;
        const cart = await getCartById(accountId);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error get cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function addProductToCartController(req, res) {
    try {
        const { accountId, productId,unitId, quantity, total } = req.body;
        const cart = await addProductToCart(accountId, productId,unitId, quantity, total);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error add product to cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function payCartController(req, res) {
    try {
        const { customerId,
            products,
            paymentMethod,
            paymentInfo,

            paymentAmount } = req.body;
        const cart = await payCart(customerId,
            products,
            paymentMethod,
            paymentInfo,

            paymentAmount);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error pay cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
async function payCartWebController(req, res) {
    try {
        const { customerId,
            products,
            paymentMethod,
            paymentInfo,
            paymentAmount } = req.body;
        const cart = await payCartWeb(
            customerId,
            products,
            paymentMethod,
            paymentInfo,
            paymentAmount);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error pay cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
async function updateCartController(req, res) {
    try {
        const { accountId, productList } = req.body;
        const cart = await updateCart(accountId, productList);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error update cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function removeProductCartController(req, res) {
    try {
        const { accountId, productId } = req.body;
        const cart = await removeProductCart(accountId, productId);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error remove product from cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateProductCartController(req, res) {
    try {
        const { accountId, productId, quantity, total } = req.body;
        const cart = await updateProductCart(accountId, productId, quantity, total);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error update product in cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateCustomerInfoController(req, res) {
    try {
        const accountId = req.params.accountId;
        const { customerInfo } = req.body;
        const customer = await updateCustomerInfo(accountId, customerInfo);
        res.status(200).json(customer);
    } catch (error) {
        console.error(`Error update customer info: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getInvoicesByAccountIdController(req, res) {
    try {
        const accountId = req.params.accountId;
        const invoices = await getInvoicesByAccountId(accountId);
        res.status(200).json(invoices);
    } catch (error) {
        console.error(`Error get cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

const checkStockQuantityInCartController = async (req, res) => {
    try {
        const { item_code, quantity } = req.query;
        const cart = await checkStockQuantityInCart(item_code, quantity);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error check stock quantity in cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}


module.exports = {
    getCartByIdController,
    addProductToCartController,
    payCartController,
    updateCartController,
    removeProductCartController,
    updateProductCartController,
    updateCustomerInfoController,
    getInvoicesByAccountIdController,
    checkStockQuantityInCartController,
    payCartWebController,
};