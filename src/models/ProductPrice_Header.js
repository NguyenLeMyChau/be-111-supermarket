const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productPriceHeaderSchema = new mongoose.Schema({
  productPriceHeaderId: { 
    type: String,
    default: function () {
      // Lấy ngày và giờ hiện tại theo định dạng yyyyMMddHHmmss
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
                      (now.getMonth() + 1).toString().padStart(2, '0') +
                      now.getDate().toString().padStart(2, '0') +
                      now.getHours().toString().padStart(2, '0') +
                      now.getMinutes().toString().padStart(2, '0') +
                      now.getSeconds().toString().padStart(2, '0');
      return `BGM${dateStr}`;
    }
  },
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
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

productPriceHeaderSchema.plugin(AutoIncrement, { inc_field: 'productPriceHeader_index' });

// Middleware 'pre' để kiểm tra nếu 'productPriceHeaderId' đã tồn tại trước khi lưu
productPriceHeaderSchema.pre('save', function (next) {
  if (!this.productPriceHeaderId) {
    // Nếu chưa có productPriceHeaderId, tạo mới theo định dạng BGM + ngày và giờ hiện tại
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                    (now.getMonth() + 1).toString().padStart(2, '0') +
                    now.getDate().toString().padStart(2, '0') +
                    now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0') +
                    now.getSeconds().toString().padStart(2, '0');
    this.productPriceHeaderId = `BGM${dateStr}`;
  }
  next();
});

const ProductPriceHeader = mongoose.model('productPrice_header', productPriceHeaderSchema, 'productPrice_header');

module.exports = ProductPriceHeader;
