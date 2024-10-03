const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const warehouseSchema = new mongoose.Schema({
    stock_quantity: { type: Number, default: 0 },
    min_stock_threshold: { type: Number, default: 0 },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product' }
}, { timestamps: true });

warehouseSchema.plugin(AutoIncrement, { inc_field: 'wareHouse_index' });

const Warehouse = mongoose.model('warehouse', warehouseSchema, 'warehouse');

module.exports = Warehouse;