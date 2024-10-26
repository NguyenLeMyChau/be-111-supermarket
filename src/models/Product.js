const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const unitConvertSchema = new mongoose.Schema({
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'unit', required: true },
  quantity: { type: Number, required: true },
  barcode: { type: String, trim: true, default: null },
  img: { type: String, trim: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  barcode: { type: String, trim: true, required: true },
  item_code: { type: String, required: true, trim: true },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
  img: { type: String, trim: true },
  unit_convert: [unitConvertSchema],

}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

productSchema.plugin(AutoIncrement, { inc_field: 'product_index' });

const Product = mongoose.model('product', productSchema, 'product');

module.exports = Product;
