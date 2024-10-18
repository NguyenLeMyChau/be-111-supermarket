const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const addressSchema = new mongoose.Schema({
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    street: { type: String, trim: true }
});

const invoiceSaleHeaderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
    paymentInfo: {
        name: { type: String, required: true, trim: true },
        address: { type: addressSchema },
        phone: { type: String, required: true, trim: true },
        gender: { type: Boolean, trim: true }
    },
    paymentMethod: { type: String, required: true },
    paymentAmount: { type: Number, required: true },
    voucher: { type: String },
}, { timestamps: true });

invoiceSaleHeaderSchema.plugin(AutoIncrement, { inc_field: 'invoiceSaleHeader_index' });

const InvoiceSaleHeader = mongoose.model('invoiceSale_header', invoiceSaleHeaderSchema, 'invoiceSale_header');

module.exports = InvoiceSaleHeader;
