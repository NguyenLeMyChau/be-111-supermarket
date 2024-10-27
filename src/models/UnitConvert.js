const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const unitConvertSchema = new mongoose.Schema({
    unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit', required: true },
    quantity: { type: Number, required: true },
    barcode: { type: String, trim: true, default: null },
    img: { type: String, trim: true },
    checkBaseUnit: { type: Boolean, default: false }
}, { timestamps: true });

unitConvertSchema.plugin(AutoIncrement, { inc_field: 'product_index' });

const UnitConvert = mongoose.model('unit_convert', unitConvertSchema, 'unit_convert');

module.exports = UnitConvert;