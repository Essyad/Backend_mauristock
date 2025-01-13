const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { cloudinary } = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid'); // Use UUID to generate unique IDs
const Product = require('../models/Product');
const Company = require('../models/Company');
const Subcategory = require('../models/Subcategory');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('subcategories_id')
      .populate('companies_id');
      const categoriesWithImages = categories.map((category) => ({
        ...category._doc,
        imageUrl: category.logo || '/uploads/placeholder.jpg', // Placeholder resim yolu
      }));
  
      res.json(categoriesWithImages);
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors du chargement des catégories.' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    // Önce kategoriyi bul
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    // Bu kategoriye ait alt kategorileri bul
    const subcategories = await Subcategory.find({
      categories_id: req.params.id
    });

    // Bu kategoriye ait ürünleri bul ve benzersiz şirket ID'lerini al
    const products = await Product.find({ 
      categoriesa_id: req.params.id 
    }).distinct('Company_id');

    // Bu şirketleri getir
    const companies = await Company.find({
      _id: { $in: products }
    });

    // Kategori nesnesini güncelle
    const categoryWithDetails = {
      ...category.toObject(),
      subcategories_id: subcategories,
      companies_id: companies
    };

    res.json(categoryWithDetails);

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: error.message });
  }
});


// Créer une catégorie
router.post('/', auth, upload.single('logo'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const categoryData = {
      name,
      logo: req.file ? req.file.path : null, // Cloudinary URL'i otomatik olarak path'te gelir
      id: uuidv4(),
    };

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error.message);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création de la catégorie.',
      error: error.message,
    });
  }
});

// Mettre à jour une catégorie
router.put('/:id', auth, upload.single('logo'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    // Eğer yeni bir logo yüklendiyse ve eski logo varsa, eski logoyu Cloudinary'den sil
    if (req.file && category.logo) {
      const publicId = category.logo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    const updates = {
      ...req.body,
      ...(req.file && { logo: req.file.path }), // Yeni Cloudinary URL'i
    };

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Une erreur est survenue lors de la mise à jour de la catégorie.' });
  }
});

// Supprimer une catégorie
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    // Cloudinary'den logo silme
    if (category.logo) {
      const publicId = category.logo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await category.deleteOne();
    res.json({ message: 'La catégorie a été supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors de la suppression de la catégorie.' });
  }
});

module.exports = router;
