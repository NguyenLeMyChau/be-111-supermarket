const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
},{
    timestamps: true, // Tự động thêm createdAt và updatedAt
  });

supplierSchema.plugin(AutoIncrement, { inc_field: 'supplier_index' });

const Supplier = mongoose.model('supplier', supplierSchema, 'supplier');

module.exports = Supplier;
