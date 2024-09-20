const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
});

supplierSchema.plugin(AutoIncrement, { inc_field: 'supplier_index' });

const Supplier = mongoose.model('supplier', supplierSchema, 'supplier');

module.exports = Supplier;
