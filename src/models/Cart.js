const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const cartSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    products: [
        {
            _id: false,
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
            unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'unit', required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: mongoose.Schema.Types.ObjectId, ref: 'productPrice_detail' },
            total: { type: Number, required: true, default: 1 },
            promotions :{ type: mongoose.Schema.Types.ObjectId, ref: 'promotion_detail',default:null},
            quantity_donate:{ type: Number, default:0}
        }
    ]
}, {
    timestamps: true,
});

cartSchema.plugin(AutoIncrement, { inc_field: 'card_index' });

const Cart = mongoose.model('cart', cartSchema, 'cart');

module.exports = Cart;
