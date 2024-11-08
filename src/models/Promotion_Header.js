const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

// Định nghĩa schema cho Promotion_Header
const PromotionHeaderSchema = new Schema({
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
  promotionHeaderId: { // Thêm trường promotionHeaderId
    type: String,
    unique: true, // Đảm bảo mỗi ID là duy nhất
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Pre-save hook to generate promotionHeaderId
PromotionHeaderSchema.pre('save', function(next) {
  if (!this.promotionHeaderId) { // Chỉ tạo ID nếu chưa có
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const day = String(now.getDate()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Tạo ID theo định dạng KM{date}{time}
    this.promotionHeaderId = `KM${year}${month}${day}${seconds}`;
  }
  next();
});

PromotionHeaderSchema.plugin(AutoIncrement, { inc_field: 'promotionHeader_index' });

// Tạo model từ schema
const PromotionHeader = mongoose.model('promotion_header', PromotionHeaderSchema, 'promotion_header');

module.exports = PromotionHeader;
