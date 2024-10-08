const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const PromotionLineSchema = new Schema({
  
    promotionHeader_id: {
      type: Schema.Types.ObjectId,
      ref: 'promotion_header', // Khóa ngoại liên kết với Promotion_Header
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
    },
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'amount', 'product'], // Loại khuyến mãi
    },
  }, {
    timestamps: true,
  });
  PromotionLineSchema.plugin(AutoIncrement, { inc_field: 'promotionLine_index' });
  
  // Tạo model từ schema
  const PromotionLine = mongoose.model('promotion_line', PromotionLineSchema, 'promotion_line');
  
  module.exports = PromotionLine;
  