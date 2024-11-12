const { get } = require("mongoose");
const { getAllInvoices, updateStatusOrder } = require("../services/invoiceService");


const getAllInvoicesController = async (req, res) => {
    try {
        const invoices = await getAllInvoices();
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const updateStatusOrderController = async (req, res) => {
    try {
        const { invoice_id, status } = req.body;
        await updateStatusOrder(invoice_id, status);
        res.status(200).json({ message: 'Update status order successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllInvoicesController,
    updateStatusOrderController
}