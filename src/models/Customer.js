const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const addressSchema = new mongoose.Schema({
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    ward: { type: String, trim: true },
    street: { type: String, trim: true }
});

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: addressSchema },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, trim: true, sparse: true },
    gender: { type: Boolean, trim: true }, // False: Nam, True: Nữ
    loyaltyPoints: { type: Number, default: 0 },
    barcode: { type: String, required: true, unique: true, trim: true },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    customer_id: { type: String, required: true, unique: true, trim: true },
});

customerSchema.plugin(AutoIncrement, { inc_field: 'customer_index' });

const Customer = mongoose.model('customer', customerSchema, 'customer');

module.exports = Customer;