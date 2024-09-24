const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const UnitSchema = new Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

supplierSchema.plugin(AutoIncrement, { inc_field: 'unit_index' });

const Unit = mongoose.model('unit', UnitSchema);

module.exports = Unit;
