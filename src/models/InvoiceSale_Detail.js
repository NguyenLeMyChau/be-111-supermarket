const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const invoiceSaleDetailSchema = new mongoose.Schema({
    invoiceSaleHeader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'invoiceSale_header', required: true },
    products:[{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
        quantity: { type: Number, required: true },
        price: {  type: Number},
        promotion : { type: mongoose.Schema.Types.ObjectId, ref: 'promotion_detail'}
}]
});

invoiceSaleDetailSchema.plugin(AutoIncrement, { inc_field: 'invoiceSaleDetail_index' });

const InvoiceSaleDetail = mongoose.model('invoiceSale_detail', invoiceSaleDetailSchema, 'invoiceSale_detail');

module.exports = InvoiceSaleDetail;
