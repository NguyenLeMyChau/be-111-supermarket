const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productPriceHeaderSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'], // Hoặc bạn có thể sử dụng boolean cho trạng thái
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
},{
    timestamps: true, // Tự động thêm createdAt và updatedAt
  });
  productPriceHeaderSchema.plugin(AutoIncrement, { inc_field: 'productPriceHeader_index' });


const ProductPriceHeader = mongoose.model('productPrice_header', productPriceHeaderSchema, 'productPrice_header');

module.exports = ProductPriceHeader;
