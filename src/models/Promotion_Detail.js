const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

// Định nghĩa schema cho Promotion_Detail
const PromotionDetailSchema = new Schema({
 
  promotionLine_id: {
    type: Schema.Types.ObjectId,
    ref: 'promotion_line', // Khóa ngoại liên kết với Promotion_Line
    required: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Khóa ngoại liên kết với Product
  },
  quantity: {
    type: Number,
  },
  product_donate: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Sản phẩm tặng kèm
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
  voucher:{
    type:String,
  }
}, {
  timestamps: true,
});

PromotionDetailSchema.plugin(AutoIncrement, { inc_field: 'promotionDetail_index' });


// Tạo model từ schema
const PromotionDetail = mongoose.model('promotion_detail', PromotionDetailSchema, 'promotion_detail');

module.exports = PromotionDetail;
