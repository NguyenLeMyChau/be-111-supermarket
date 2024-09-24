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
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

productSchema.plugin(AutoIncrement, { inc_field: 'promotion_header_index' });


// Tạo model từ schema
const PromotionHeader = mongoose.model('promotion_header', PromotionHeaderSchema);

module.exports = PromotionHeader;
