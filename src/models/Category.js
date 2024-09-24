const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

// Định nghĩa schema cho Category
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
},{
  timestamps: true, // Tự động thêm createdAt và updatedAt
});
productSchema.plugin(AutoIncrement, { inc_field: 'category_index' });

const Category = mongoose.model("category", CategorySchema);

module.exports = Category;
