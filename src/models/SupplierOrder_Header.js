const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supplierOrderHeaderSchema = new mongoose.Schema({
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier' },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    status: {
        type: String,
        enum: ['Đang chờ xử lý', 'Đã duyệt', 'Bị từ chối', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'],
        default: 'PENDING'
    }
}, { timestamps: true });

supplierOrderHeaderSchema.plugin(AutoIncrement, { inc_field: 'supplierOrderHeader_index' });

const SupplierOrderHeader = mongoose.model('supplierOrder_header', supplierOrderHeaderSchema, 'supplierOrder_header');

module.exports = SupplierOrderHeader;
