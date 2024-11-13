const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const invoiceRefundDetailSchema = new mongoose.Schema({
    invoiceRefundHeader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'invoiceRefund_header', required: true },
    products:[{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
        unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
        quantity: { type: Number, required: true },
        price: {  type: Number},
        promotion : { type: mongoose.Schema.Types.ObjectId, ref: 'promotion_detail'}
}]
});

invoiceRefundDetailSchema.plugin(AutoIncrement, { inc_field: 'invoiceRefundDetail_index' });

const InvoiceRefundDetail = mongoose.model('invoiceRefund_detail', invoiceRefundDetailSchema, 'invoiceRefund_detail');

module.exports = InvoiceRefundDetail;
