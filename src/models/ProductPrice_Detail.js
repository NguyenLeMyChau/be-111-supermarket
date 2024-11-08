const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productPriceDetailSchema = new mongoose.Schema({
  productPriceHeader_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'productPrice_header',
    required: true
  },
  isActive: { type: Boolean, default: true },
  item_code: { type: String, required: true },
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
  price: {
    type: Number,
    required: true
  },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});
productPriceDetailSchema.plugin(AutoIncrement, { inc_field: 'productPriceDetail_index' });



const ProductPriceDetail = mongoose.model('productPrice_detail', productPriceDetailSchema, 'productPrice_detail');

module.exports = ProductPriceDetail;
