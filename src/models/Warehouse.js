const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const warehouseSchema = new mongoose.Schema({
    stock_quantity: { type: Number, default: 0 },
    item_code: { type: String, required: true },
    unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
}, { timestamps: true });

warehouseSchema.plugin(AutoIncrement, { inc_field: 'wareHouse_index' });

const Warehouse = mongoose.model('warehouse', warehouseSchema, 'warehouse');

module.exports = Warehouse;
