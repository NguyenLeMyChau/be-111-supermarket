const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const UnitSchema = new Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  }
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
});

UnitSchema.plugin(AutoIncrement, { inc_field: 'unit_index' });

const Unit = mongoose.model('unit', UnitSchema, 'unit');

module.exports = Unit;
