const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const addressSchema = new mongoose.Schema({
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  ward: { type: String, trim: true },
  street: { type: String, trim: true }
});

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: addressSchema },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

supplierSchema.plugin(AutoIncrement, { inc_field: 'supplier_index' });

const Supplier = mongoose.model('supplier', supplierSchema, 'supplier');

module.exports = Supplier;
