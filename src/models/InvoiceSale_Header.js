const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const invoiceSaleHeaderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
}, { timestamps: true });

invoiceSaleHeaderSchema.plugin(AutoIncrement, { inc_field: 'invoiceSaleHeader_index' });

const InvoiceSaleHeader = mongoose.model('invoiceSale_header', invoiceSaleHeaderSchema, 'invoiceSale_header');

module.exports = InvoiceSaleHeader;
