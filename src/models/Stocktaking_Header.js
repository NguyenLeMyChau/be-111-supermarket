const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const stocktakingHeaderSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    stocktaking_id: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
}, { timestamps: true });

stocktakingHeaderSchema.plugin(AutoIncrement, { inc_field: 'stocktakingHeader_index' });

const StocktakingHeader = mongoose.model('stocktaking_header', stocktakingHeaderSchema, 'stocktaking_header');

module.exports = StocktakingHeader;
