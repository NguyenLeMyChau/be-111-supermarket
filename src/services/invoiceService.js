const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Unit = require('../models/Unit');

const getAllInvoices = async () => {
    const invoicesHeader = await InvoiceSaleHeader.find();
    const invoices = await Promise.all(invoicesHeader.map(async (header) => {
        const details = await InvoiceSaleDetail.find({ invoiceSaleHeader_id: header._id });
        const customer = await Customer.findOne({ account_id: header.customer_id }).select('name');

        // Lấy thông tin sản phẩm cho mỗi chi tiết hóa đơn
        const detailsWithProductInfo = await Promise.all(details.map(async (detail) => {
            const product = await Product.findById(detail.product_id).select('name unit_id');
            const unit = await Unit.findById(product.unit_id).select('description');

            return {
                ...detail.toObject(),
                productName: product ? product.name : 'Unknown',
                unit: unit ? unit.description : 'Unknown'
            };
        }));

        return {
            ...header.toObject(),
            customerName: customer ? customer.name : 'Unknown',
            details: detailsWithProductInfo
        };

    }));
    return invoices;
};

module.exports = {
    getAllInvoices
};