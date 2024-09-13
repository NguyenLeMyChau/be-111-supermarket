const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    createdDate: {
        type: Date,
        required: true,
    },
    updateDate: {
        type: Date,
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
    }
})

module.exports = mongoose.model('account', accountSchema, 'account');