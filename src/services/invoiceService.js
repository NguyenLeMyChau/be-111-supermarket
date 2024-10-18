const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Unit = require('../models/Unit');

const getAllInvoices = async () => {
    const invoicesHeader = await InvoiceSaleHeader.find();

    const invoices = await Promise.all(invoicesHeader.map(async (header) => {
        const customer = await Customer.findOne({ account_id: header.customer_id }).select('name');
        const detail = await InvoiceSaleDetail.findOne({ invoiceSaleHeader_id: header._id }).lean();

        // Duyệt qua products bên trong detail
        const productsWithInfo = await Promise.all(detail.products.map(async (item) => {
            const product = await Product.findById(item.product).select('name img unit_id').lean();
            const unit = await Unit.findById(product.unit_id).select('description').lean();

            return {
                ...item,
                productName: product ? product.name : 'Unknown',
                productImg: product ? product.img : null,
                unitName: unit ? unit.description : 'Unknown'
            };
        }));;


        return {
            ...header.toObject(),
            customerName: customer ? customer.name : 'Unknown',
            details: productsWithInfo
        };

    }));
    return invoices;
};

module.exports = {
    getAllInvoices
};