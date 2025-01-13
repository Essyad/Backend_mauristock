const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const companySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de l\'entreprise est requis.'],
    trim: true,
  },
  logo: {
    type: String,
  },
  categories_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  subcategories_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
  ],
  id: {
    type: String,
    unique: true, // Benzersiz olması zorunlu
    default: uuidv4, // Varsayılan olarak benzersiz bir UUID oluştur
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Logo dosyasını silmek için bir pre hook
companySchema.pre('remove', async function (next) {
  if (this.logo) {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(__dirname, '..', this.logo);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }
  }
  next();
});

module.exports = mongoose.model('Company', companySchema);
