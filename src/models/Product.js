const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, trim: true },
    itemcode: { type: String, required: true, trim: true },
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier' },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    
},{
    timestamps: true, // Tự động thêm createdAt và updatedAt
  });

productSchema.plugin(AutoIncrement, { inc_field: 'product_index' });

const Product = mongoose.model('product', productSchema, 'product');

module.exports = Product;