const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supplierOrderHeaderSchema = new mongoose.Schema({
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplier' },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    }
}, { timestamps: true });

supplierOrderHeaderSchema.plugin(AutoIncrement, { inc_field: 'supplierOrderHeader_index' });

const SupplierOrderHeader = mongoose.model('supplierOrder_header', supplierOrderHeaderSchema, 'supplierOrder_header');

module.exports = SupplierOrderHeader;
