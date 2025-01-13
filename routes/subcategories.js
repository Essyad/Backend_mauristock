const express = require('express');
const router = express.Router();
const Subcategory = require('../models/Subcategory');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Récupérer toutes les sous-catégories
router.get('/', async (req, res) => {
  try {
    const subcategories = await Subcategory.find()
      .populate('categories_id')
      .populate('products_id');
    
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors du chargement des sous-catégories.' });
  }
});

// Récupérer les sous-catégories par catégorie
router.get('/by-category/:categoryId', async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      categories_id: req.params.categoryId
    });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching subcategories',
      error: error.message 
    });
  }
});

// Créer une sous-catégorie
router.post('/', auth, async (req, res) => {
  try {
    const { name, categories_id } = req.body;

    if (!name || !categories_id) {
      return res.status(400).json({ message: 'Le nom et la catégorie principale sont requis.' });
    }

    // Create a new subcategory with a unique ID
    const subcategory = new Subcategory({
      ...req.body,
      id: uuidv4(), // Generate a unique ID
    });

    await subcategory.save();

    const savedSubcategory = await Subcategory.findById(subcategory._id).populate('categories_id');
    res.status(201).json(savedSubcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error.message);
    res.status(400).json({
      message: 'Une erreur est survenue lors de l\'enregistrement de la sous-catégorie.',
      error: error.message,
    });
  }
});

// Mettre à jour une sous-catégorie
router.put('/:id', auth, async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Sous-catégorie introuvable.' });
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('categories_id');

    res.json(updatedSubcategory);
  } catch (error) {
    res.status(400).json({ message: 'Une erreur est survenue lors de la mise à jour de la sous-catégorie.' });
  }
});

// Supprimer une sous-catégorie
router.delete('/:id', auth, async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Sous-catégorie introuvable.' });
    }

    await subcategory.deleteOne();
    res.json({ message: 'La sous-catégorie a été supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors de la suppression de la sous-catégorie.' });
  }
});

module.exports = router;
