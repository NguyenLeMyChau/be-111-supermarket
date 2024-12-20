const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const invoiceSaleDetailSchema = new mongoose.Schema({
    invoiceSaleHeader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'invoiceSale_header', required: true },
    promotionOnInvoice: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'promotion_detail', 
        default: null 
    },
    products:[{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
        unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
        quantity: { type: Number, required: true },
        quantity_donate: { type: Number, default: 0},
        price: {  type: Number},
        promotion : { type: mongoose.Schema.Types.ObjectId, ref: 'promotion_detail',default:null}
}]
});

invoiceSaleDetailSchema.plugin(AutoIncrement, { inc_field: 'invoiceSaleDetail_index' });

const InvoiceSaleDetail = mongoose.model('invoiceSale_detail', invoiceSaleDetailSchema, 'invoiceSale_detail');

module.exports = InvoiceSaleDetail;
