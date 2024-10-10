const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
    products: [productSchema]
}, {
    timestamps: true,
});

cartSchema.plugin(AutoIncrement, { inc_field: 'card_index' });

const Cart = mongoose.model('cart', cartSchema, 'cart');

module.exports = Cart;
