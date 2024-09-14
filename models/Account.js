const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['staff', 'manager', 'customer'] }, // Chỉ định các vai trò
  createdDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

const Account = mongoose.model('account', accountSchema, 'account');

module.exports = Account;
