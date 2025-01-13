const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: String, // Use String to store UUID
    unique: true, // Ensure the field is unique
  },
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis.'],
    trim: true,
  },
  logo: {
    type: String,
  },
  subcategories_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
  ],
  companies_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
  ],
  description: { type: String },
  image: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Category', categorySchema);
