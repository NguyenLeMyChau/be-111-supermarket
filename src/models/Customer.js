const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    gender: { type: Boolean, trim: true }, //False: Nam, True: Nữ,
    loyaltyPoints: { type: Number, default: 0 },
    barcode: { type: String, required: true, unique: true, trim: true },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' }
});

customerSchema.plugin(AutoIncrement, { inc_field: 'customer_index' });

const Customer = mongoose.model('customer', customerSchema, 'customer');

module.exports = Customer;
