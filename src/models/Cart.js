const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const cartSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    products: [
        {
            _id: false,
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: mongoose.Schema.Types.ObjectId, ref: 'productPrice_detail' },
            total: { type: Number, required: true, default: 1 }
        }
    ]
}, {
    timestamps: true,
});

cartSchema.plugin(AutoIncrement, { inc_field: 'card_index' });

const Cart = mongoose.model('cart', cartSchema, 'cart');

module.exports = Cart;
