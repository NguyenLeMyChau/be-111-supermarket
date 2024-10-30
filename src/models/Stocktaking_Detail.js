const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const stocktakingDetailSchema = new mongoose.Schema({
    supplierOrderHeader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplierOrder_header' },
    products: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit' },
        quantity_stock: { type: Number, default: 0 },
        quantity_actual: { type: Number, default: 0 },
    }],
}, { timestamps: true });

stocktakingDetailSchema.plugin(AutoIncrement, { inc_field: 'stocktakingDetail_index' });

const StocktakingDetail = mongoose.model('stocktaking_detail', stocktakingDetailSchema, 'stocktaking_detail');

module.exports = StocktakingDetail;
