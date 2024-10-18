const { get } = require("mongoose");
const { getAllInvoices } = require("../services/invoiceService");


const getAllInvoicesController = async (req, res) => {
    try {
        const invoices = await getAllInvoices();
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllInvoicesController
}