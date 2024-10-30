const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

// Định nghĩa schema cho Promotion_Detail
const PromotionDetailSchema = new Schema({
  promotionDetailId: {
    type: String,
    unique: true, 
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  promotionLine_id: {
    type: Schema.Types.ObjectId,
    ref: 'promotion_line', // Khóa ngoại liên kết với Promotion_Line
    required: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Khóa ngoại liên kết với Product
  },
  unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
  quantity: {
    type: Number,
  },
  unit_id_donate: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
  quantity_donate: {
    type: Number,
  },
  product_donate: {
    type: Schema.Types.ObjectId,
    ref: 'product', // Sản phẩm tặng kèm
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

// Tạo auto-increment field
PromotionDetailSchema.plugin(AutoIncrement, { inc_field: 'promotionDetail_index' });

// Tạo promotionDetailId theo format yêu cầu
PromotionDetailSchema.pre('save', function (next) {
  if (!this.promotionDetailId) {
    const date = new Date();
    const formattedDate = 
      `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}` +
      `${String(date.getDate()).padStart(2, '0')}` +
      `${String(date.getHours()).padStart(2, '0')}` +
      `${String(date.getMinutes()).padStart(2, '0')}` +
      `${String(date.getSeconds()).padStart(2, '0')}`;

    this.promotionDetailId = `CT${formattedDate}`;
  }
  next();
});

// Tạo model từ schema
const PromotionDetail = mongoose.model('promotion_detail', PromotionDetailSchema, 'promotion_detail');

module.exports = PromotionDetail;
