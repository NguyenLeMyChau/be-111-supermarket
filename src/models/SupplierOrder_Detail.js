const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const supplierOrderDetailSchema = new mongoose.Schema({
    supplierOrderHeader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'supplierOrder_header' },
    products: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        quantity: { type: Number, default: 0 },
        price_order: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }],
});

supplierOrderDetailSchema.plugin(AutoIncrement, { inc_field: 'supplierOrderDetail_index' });

const SupplierOrderDetail = mongoose.model('supplierOrder_detail', supplierOrderDetailSchema, 'supplierOrder_detail');

module.exports = SupplierOrderDetail;
