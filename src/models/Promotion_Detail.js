const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

// Định nghĩa schema cho Promotion_Detail
const PromotionDetailSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true, // Tự động tạo ObjectId
  },
  promotionLine_id: {
    type: Schema.Types.ObjectId,
    ref: 'promotion_line', // Khóa ngoại liên kết với Promotion_Line
    required: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Khóa ngoại liên kết với Product
    required: true,
  },
  unit_id: {
    type: Schema.Types.ObjectId,
    ref: 'unit', // Khóa ngoại liên kết với Unit
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  product_donate: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Sản phẩm tặng kèm
  },
  unit_donate: {
    type: Schema.Types.ObjectId,
    ref: 'unit', // Đơn vị tặng kèm
  },
  quantity_donate: {
    type: Number,
  },
  amount_sales: {
    type: Number,
  },
  amount_donate: {
    type: Number,
  },
  percent: {
    type: Number,
  },
  amount_limit: {
    type: Number,
  },
}, {
  timestamps: true,
});

PromotionDetailSchema.plugin(AutoIncrement, { inc_field: 'productPriceDetail_index' });


// Tạo model từ schema
const PromotionDetail = mongoose.model('promotion_detail', PromotionDetailSchema, 'promotion_detail');

module.exports = PromotionDetail;
