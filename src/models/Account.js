const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const accountSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, trim: true },
  role: {
    type: String, required: true, enum: ['staff', 'manager', 'customer'], // Chỉ định các vai trò
    set: function (value) {
      return value.toLowerCase();  // Chuyển về chữ thường trước khi lưu
    }
  },
  active: { type: Boolean, default: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'roleRef'
  },
  roleRef: {
    type: String,
    required: true,
    enum: ['employee', 'customer']
  }
}, { timestamps: true });

accountSchema.plugin(AutoIncrement, { inc_field: 'account_index' });

const Account = mongoose.model('account', accountSchema, 'account');

module.exports = Account;
