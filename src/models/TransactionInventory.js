const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TransactionInventorySchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
    quantity: { type: Number, default: 0 },
    type: { type: String, enum: ['sell', 'return', 'import'], required: true },

}, { timestamps: true });

TransactionInventorySchema.plugin(AutoIncrement, { inc_field: 'transactionInventory_index' });

const TransactionInventory = mongoose.model('transactionInventory', TransactionInventorySchema, 'transactionInventory');

module.exports = TransactionInventory;
