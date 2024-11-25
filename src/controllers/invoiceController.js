const { get } = require("mongoose");
const { getAllInvoices, updateStatusOrder,getAllInvoicesRefund, getInvoiceByInvoiceCode } = require("../services/invoiceService");


const getAllInvoicesController = async (req, res) => {
    try {
        const invoices = await getAllInvoices();
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const getInvoiceByInvoiceCodeController = async (req, res) => {
    const {invoiceCode} = req.body
    try {
        const invoices = await getInvoiceByInvoiceCode(invoiceCode);
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const getAllInvoicesRefundController = async (req, res) => {
    try {
        const invoices = await getAllInvoicesRefund();
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const updateStatusOrderController = async (req, res) => {
    try {
        const { invoice_id, status,employee_id } = req.body;
        await updateStatusOrder(invoice_id, status,employee_id);
        res.status(200).json({ message: 'Update status order successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllInvoicesController,
    updateStatusOrderController,
    getAllInvoicesRefundController,
    getInvoiceByInvoiceCodeController
}