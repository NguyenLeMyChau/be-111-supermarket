const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supplierOrderHeaderSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    bill_id: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    status: { type: Boolean, default: true },
    cancel_reason: { type: String, required: function () { return !this.status; } }
}, { timestamps: true });

supplierOrderHeaderSchema.plugin(AutoIncrement, { inc_field: 'supplierOrderHeader_index' });

supplierOrderHeaderSchema.pre('save', function (next) {
    if (!this.status && !this.cancel_reason) {
        return next(new Error('Cancel reason is required when status is false'));
    }
    next();
});

const SupplierOrderHeader = mongoose.model('supplierOrder_header', supplierOrderHeaderSchema, 'supplierOrder_header');

module.exports = SupplierOrderHeader;
