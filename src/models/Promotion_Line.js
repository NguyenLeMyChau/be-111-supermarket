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
    enum: ['active', 'inactive','pauseactive'],
    default: 'inactive'
  },
   isActive: { type: Boolean, default: true },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'amount', 'quantity'], // Loại khuyến mãi
  },
  promotionLineId: { // Thêm trường promotionLineId
    type: String,
    unique: true, // Đảm bảo mỗi ID là duy nhất
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate promotionLineId
PromotionLineSchema.pre('save', function(next) {
  if (!this.promotionLineId) { // Chỉ tạo ID nếu chưa có
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const day = String(now.getDate()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Tạo ID theo định dạng LINE{date}{time}
    this.promotionLineId = `LINE${year}${month}${day}${minutes}${seconds}`;
  }
  next();
});

PromotionLineSchema.plugin(AutoIncrement, { inc_field: 'promotionLine_index' });

// Tạo model từ schema
const PromotionLine = mongoose.model('promotion_line', PromotionLineSchema, 'promotion_line');

module.exports = PromotionLine;
