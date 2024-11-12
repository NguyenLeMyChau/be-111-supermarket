const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Unit = require('../models/Unit');
const PromotionDetail = require('../models/Promotion_Detail');
const PromotionLine = require('../models/Promotion_Line');

const getAllInvoices = async () => {
    const invoicesHeader = await InvoiceSaleHeader.find();

    const invoices = await Promise.all(invoicesHeader.map(async (header) => {
        const customer = await Customer.findOne({ account_id: header.customer_id }).select('name');
        const detail = await InvoiceSaleDetail.findOne({ invoiceSaleHeader_id: header._id }).lean();

        // Duyệt qua products bên trong detail
        const productsWithInfo = await Promise.all(detail.products.map(async (item) => {
            const product = await Product.findById(item.product);
            const unit = await Unit.findById(item.unit_id).select('description').lean();
            const promotionDetail = await PromotionDetail.findOne({ _id: item.promotion }).lean();
            let promotionLine = null;

            if (promotionDetail) {
                promotionLine = await PromotionLine.findOne({ _id: promotionDetail.promotionLine_id }).lean();

                // Gán promotionDetail vào promotionLine nếu promotionLine tồn tại
                if (promotionLine) {
                    promotionLine.promotionDetail = promotionDetail;
                }
            }

            // Tính giá sau khuyến mãi (nếu khuyến mãi là loại "amount")
            let total = 0;
            let discountedPrice = item.price;
            let productBuy = null;
            let productDonate = null;

            if (promotionLine && promotionLine.type === 'amount') {
                const discountAmount = promotionDetail.amount_donate || 0;
                const minQuantity = promotionDetail.quantity || 1;
                if (item.quantity >= minQuantity) {
                    discountedPrice = Math.max(0, item.price - discountAmount);
                    total = item.quantity * discountedPrice;
                }
            } else if (promotionLine && promotionLine.type === 'quantity') {
                const minQuantity = promotionDetail.quantity || 1; // Số lượng cần mua
                const quantityDonate = promotionDetail.quantity_donate || 0; // Số lượng được tặng

                // Truy vấn thông tin sản phẩm mua và sản phẩm được tặng
                productBuy = await Product.findOne({ _id: promotionDetail.product_id }).select('name img').populate('unit_id', 'description').lean();
                productDonate = await Product.findOne({ _id: promotionDetail.product_donate }).select('name img').populate('unit_id', 'description').lean();

                // Số lượng sản phẩm mà khách hàng cần mua thực tế (không tính số lượng được tặng)
                const chargeableQuantity = Math.floor(item.quantity / (minQuantity + quantityDonate)) * minQuantity
                    + (item.quantity % (minQuantity + quantityDonate));

                // Tổng tiền phải trả
                total = chargeableQuantity * item.price;

                // Gắn thông tin productBuy và productDonate vào productDetail
                promotionDetail.productBuy = productBuy;  // Thêm thông tin sản phẩm mua
                promotionDetail.productDonate = productDonate; // Thêm thông tin sản phẩm tặng
            } else {
                discountedPrice = 0;
                total = item.quantity * item.price;
            }

            return {
                ...item,
                promotion: promotionLine,
                total,
                productName: product ? product.name : 'Unknown',
                productImg: product ? product.img : null,
                unit: unit ? unit : 'Unknown',
                item_code: product ? product.item_code : 'Unknown'
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

const updateStatusOrder = async (invoice_id, status) => {
    const invoice = await InvoiceSaleHeader.findOne({ _id: invoice_id });
    if (invoice) {
        invoice.status = status;
        await invoice.save();
    }
};

module.exports = {
    getAllInvoices,
    updateStatusOrder
};