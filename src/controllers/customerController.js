
const { getInvoiceById, addProductToCart, getCartById, payCart, updateCart, removeProductCart, updateProductCart, updateCustomerInfo, getInvoicesByAccountId, checkStockQuantityInCart, getAllPromotionActive, payCartWeb, getCustomerByPhone, getInvoiceLast ,refundWeb, getInvoiceRefundById} = require("../services/customerService");

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
        const { accountId, productId, unitId, quantity, total,promotions } = req.body;
        const cart = await addProductToCart(accountId, productId, unitId, quantity, total,promotions);
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
            paymentAmount,promotionOnInvoice,discountPayment,
            totalPayment } = req.body;
        const cart = await payCart(customerId,
            products,
            paymentMethod,
            paymentInfo,
            paymentAmount,promotionOnInvoice,discountPayment,
            totalPayment);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error pay cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}
async function payCartWebController(req, res) {
    try {
        const { employee, customerId,
            products,
            paymentMethod,
            paymentInfo,
            paymentAmount,promotionOnInvoice , discountPayment,
            totalPayment} = req.body;
        const cart = await payCartWeb(employee,
            customerId,
            products,
            paymentMethod,
            paymentInfo,
            paymentAmount,
            promotionOnInvoice,discountPayment,
            totalPayment);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error pay cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function refundWebController(req, res) {
    try {
        const {invoiceCode,employee,refundReason } = req.body;
        const cart = await refundWeb(invoiceCode,employee,refundReason);
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
        const { accountId, productId, unit_id } = req.body;
        const cart = await removeProductCart(accountId, productId, unit_id);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error remove product from cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function updateProductCartController(req, res) {
    try {
        const { accountId, productId,  unitId, quantity, total } = req.body;
        const cart = await updateProductCart(accountId, productId,unitId, quantity, total);
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
        const { item_code, unit_id, quantity } = req.query;
        const cart = await checkStockQuantityInCart(item_code, unit_id, quantity);
        res.status(200).json(cart);
    } catch (error) {
        console.error(`Error check stock quantity in cart: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

async function getCustomerByPhoneController(req, res) {
    const { phone } = req.params;

    try {
        // Call service to fetch customer by phone
        const customer = await getCustomerByPhone(phone);

        // If customer is found, return it as the response
        res.status(200).json({
            success: true,
            message: "Customer found",
            data: customer,
        });
    } catch (error) {
        // Check the specific error message to determine the response
        if (error.message === "Phone number not registered.") {
            res.status(404).json({
                success: false,
                message: "Phone number not registered",
            });
        } else {
            // Handle other errors
            console.error("Error fetching customer:", error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    }
}
const getInvoiceByCode = async (req, res) => {
    const { invoiceCode } = req.params; // Lấy mã hóa đơn từ URL

    try {
        const invoiceData = await getInvoiceById(invoiceCode);

        // Kiểm tra nếu không tìm thấy hóa đơn
        if (!invoiceData.invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        // Trả về dữ liệu hóa đơn và chi tiết hóa đơn
        res.status(200).json(invoiceData);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};

const getInvoiceRefundByCode = async (req, res) => {
    const { invoiceCode } = req.params; // Lấy mã hóa đơn từ URL

    try {
        const invoiceData = await getInvoiceRefundById(invoiceCode);

        // Kiểm tra nếu không tìm thấy hóa đơn
        if (!invoiceData.invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        // Trả về dữ liệu hóa đơn và chi tiết hóa đơn
        res.status(200).json(invoiceData);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};
const getInvoiceLastController = async (req, res) => {
    try {
        const lastInvoice = await getInvoiceLast(); // Gọi service
        if (lastInvoice) {
            res.status(200).json(lastInvoice);
        } else {
            res.status(404).json({ message: "Không tìm thấy hóa đơn nào" });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy hóa đơn cuối cùng", error: error.message });
    }
};
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
    getCustomerByPhoneController,
    getInvoiceByCode,
    getInvoiceLastController,
    refundWebController,
    getInvoiceRefundByCode
};