const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const subcategorySchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: uuidv4, // Generate unique ID if not provided
  },
  name: {
    type: String,
    required: [true, 'Le nom de la sous-catégorie est requis.'],
    trim: true,
  },
  categories_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie principale est requise.'],
  },
  products_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Subcategory', subcategorySchema);
