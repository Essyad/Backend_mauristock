const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { cloudinary } = require('../config/cloudinary');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Test endpoint'i - basitleştirilmiş
router.get('/test', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    database: {
      connected: dbState === 1
    }
  });
});

// Promotions endpoint'i - search'ten önce tanımlanmalı
router.get('/promotions', async (req, res) => {
  try {
    const today = new Date();
    
    const promotions = await Product.find({
      discountedPrice: { $ne: null },
      discountDuration: { $gte: today }
    })
    .populate('Company_id', 'nom')
    .populate('categoriesa_id', 'name')
    .populate('subcategories_id', 'name');

    if (!promotions || promotions.length === 0) {
      return res.status(200).json([]); // Boş array dön, 404 yerine
    }

    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors du chargement des promotions',
      error: error.message
    });
  }
});

// Arama endpoint'i
router.get('/search', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, hasDiscount } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Ana sorgu
    let query = {
      nom: { $regex: q, $options: 'i' }
    };

    // Fiyat ve indirim filtresi
    if (minPrice || maxPrice || hasDiscount === 'true') {
      const priceConditions = [];

      // İndirimli ürünler için koşul
      if (hasDiscount === 'true') {
        const discountCondition = {
          discountedPrice: { $ne: null }
        };
        
        // İndirimli ürünler için fiyat aralığı
        if (minPrice || maxPrice) {
          discountCondition.discountedPrice = {
            ...(minPrice && { $gte: parseFloat(minPrice) }),
            ...(maxPrice && { $lte: parseFloat(maxPrice) })
          };
        }
        
        priceConditions.push(discountCondition);
      } else {
        // Hem indirimli hem indirimsiz ürünler için koşullar
        if (minPrice || maxPrice) {
          // İndirimli ürünler için
          priceConditions.push({
            discountedPrice: { $ne: null },
            discountedPrice: {
              ...(minPrice && { $gte: parseFloat(minPrice) }),
              ...(maxPrice && { $lte: parseFloat(maxPrice) })
            }
          });

          // İndirimsiz ürünler için
          priceConditions.push({
            $or: [
              { discountedPrice: null },
              { discountedPrice: { $exists: false } }
            ],
            oldPrice: {
              ...(minPrice && { $gte: parseFloat(minPrice) }),
              ...(maxPrice && { $lte: parseFloat(maxPrice) })
            }
          });
        }
      }

      if (priceConditions.length > 0) {
        query.$and = [
          { nom: { $regex: q, $options: 'i' } },
          { $or: priceConditions }
        ];
      }
    }

    const products = await Product.find(query)
      .populate('Company_id', 'nom')
      .populate('categoriesa_id', 'name')
      .populate('subcategories_id', 'name')
      .exec();

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la recherche',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      subcategories,
      companies,
      minPrice,
      maxPrice,
      features,
      hasDiscount
    } = req.query;

    let query = {};

    // Kategori filtresi
    if (categoryId) {
      query.categoriesa_id = categoryId;
    }

    // Alt kategori filtresi
    if (subcategories) {
      query.subcategories_id = { $in: subcategories.split(',') };
    }

    // Şirket filtresi
    if (companies) {
      query.Company_id = { $in: companies.split(',') };
    }

    // Fiyat filtresi
    // Fiyat ve indirim filtresi
    if (minPrice || maxPrice || hasDiscount === 'true') {
      const priceConditions = [];

      // İndirimli ürünler için koşul
      if (hasDiscount === 'true') {
        const discountCondition = {
          discountedPrice: { $ne: null }
        };
        
        // İndirimli ürünler için fiyat aralığı
        if (minPrice || maxPrice) {
          discountCondition.discountedPrice = {
            ...(minPrice && { $gte: parseFloat(minPrice) }),
            ...(maxPrice && { $lte: parseFloat(maxPrice) })
          };
        }
        
        priceConditions.push(discountCondition);
      } else {
        // Hem indirimli hem indirimsiz ürünler için koşullar
        if (minPrice || maxPrice) {
          // İndirimli ürünler için
          priceConditions.push({
            discountedPrice: { $ne: null },
            discountedPrice: {
              ...(minPrice && { $gte: parseFloat(minPrice) }),
              ...(maxPrice && { $lte: parseFloat(maxPrice) })
            }
          });

          // İndirimsiz ürünler için
          priceConditions.push({
            $or: [
              { discountedPrice: null },
              { discountedPrice: { $exists: false } }
            ],
            oldPrice: {
              ...(minPrice && { $gte: parseFloat(minPrice) }),
              ...(maxPrice && { $lte: parseFloat(maxPrice) })
            }
          });
        }
      }

      if (priceConditions.length > 0) {
        query.$or = priceConditions;
      }
    }

    // Özellik filtresi
    if (features) {
      query.features = { $in: features.split(',') };
    }

    // İndirim filtresi
    if (hasDiscount === 'true') {
      query.discountedPrice = { $ne: null };
    }


    const products = await Product.find(query)
      .populate('Company_id', 'nom')
      .populate('categoriesa_id', 'name')
      .populate('subcategories_id', 'name');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ürün oluşturma - Cloudinary ile
router.post('/', auth, upload.single('picture'), async (req, res) => {
  try {
    let pictureUrl;
    if (req.file) {
      // Cloudinary'ye yükle
      const result = await cloudinary.uploader.upload(req.file.path);
      pictureUrl = result.secure_url;
      
      // Geçici dosyayı sil
      fs.unlinkSync(req.file.path);
    }

    const productData = {
      ...req.body,
      id: uuidv4(),
      picture: pictureUrl || undefined,
      oldPrice: parseFloat(req.body.oldPrice),
      discountedPrice: req.body.discountedPrice ? parseFloat(req.body.discountedPrice) : null,
      categoriesa_id: Array.isArray(req.body.categoriesa_id)
        ? req.body.categoriesa_id
        : req.body.categoriesa_id
        ? req.body.categoriesa_id.split(',')
        : [],
      subcategories_id: Array.isArray(req.body.subcategories_id)
        ? req.body.subcategories_id
        : req.body.subcategories_id
        ? req.body.subcategories_id.split(',')
        : []
    };

    const product = new Product(productData);
    await product.save();

    const savedProduct = await Product.findById(product._id)
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');

    res.status(201).json(savedProduct);
  } catch (error) {
    // Hata durumunda geçici dosyayı temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating product:', error);
    res.status(400).json({ 
      message: 'Une erreur est survenue lors de la création du produit.',
      error: error.message 
    });
  }
});

// Ürün güncelleme - Cloudinary ile
router.put('/:id', auth, upload.single('picture'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    let pictureUrl = product.picture;
    if (req.file) {
      // Eski resmi Cloudinary'den sil
      if (product.picture) {
        const publicId = product.picture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      // Yeni resmi Cloudinary'ye yükle
      const result = await cloudinary.uploader.upload(req.file.path);
      pictureUrl = result.secure_url;
      
      // Geçici dosyayı sil
      fs.unlinkSync(req.file.path);
    }

    const updates = {
      ...req.body,
      picture: pictureUrl,
      ...(req.body.oldPrice && { oldPrice: parseFloat(req.body.oldPrice) }),
      ...(req.body.discountedPrice && { discountedPrice: parseFloat(req.body.discountedPrice) }),
      categoriesa_id: Array.isArray(req.body.categoriesa_id)
        ? req.body.categoriesa_id
        : req.body.categoriesa_id
        ? req.body.categoriesa_id.split(',')
        : product.categoriesa_id,
      subcategories_id: Array.isArray(req.body.subcategories_id)
        ? req.body.subcategories_id
        : req.body.subcategories_id
        ? req.body.subcategories_id.split(',')
        : product.subcategories_id
    };

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');

    res.json(updatedProduct);
  } catch (error) {
    // Hata durumunda geçici dosyayı temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating product:', error);
    res.status(400).json({ 
      message: 'Une erreur est survenue lors de la mise à jour du produit.',
      error: error.message 
    });
  }
});

// Ürün silme - Cloudinary ile
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    // Cloudinary'den resmi sil
    if (product.picture) {
      const publicId = product.picture.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await product.deleteOne();
    res.json({ message: 'Le produit a été supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Une erreur est survenue lors de la suppression du produit.',
      error: error.message 
    });
  }
});

// Récupérer un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');

    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors du chargement du produit.' });
  }
});

// Get products by category and optional subcategory
router.get('/category/:categoryId', async (req, res) => {
  try {
    const query = { categoriesa_id: req.params.categoryId };
    if (req.query.subcategoryId) {
      query.subcategories_id = req.query.subcategoryId;
    }
    const products = await Product.find(query)
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error loading products.' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { searchTerm, categories, subcategories, companies } = req.query;
    const query = {};

    if (searchTerm) {
      query.nom = { $regex: searchTerm, $options: 'i' }; // Arama terimine göre filtreleme
    }

    if (categories) {
      query.categoriesa_id = { $in: categories.split(',') }; // Kategorilere göre filtreleme
    }

    if (subcategories) {
      query.subcategories_id = { $in: subcategories.split(',') }; // Alt kategorilere göre filtreleme
    }

    if (companies) {
      query.Company_id = { $in: companies.split(',') }; // Şirketlere göre filtreleme
    }

    const products = await Product.find(query)
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Ürünleri yüklerken hata oluştu.', error: error.message });
  }
});

// Ajouter ou modifier une remise
router.put('/:id/discount', auth, async (req, res) => {
  try {
    const { discountedPrice, discountDuration, discountPercentage } = req.body;

    if (!discountedPrice || !discountDuration) {
      return res.status(400).json({
        success: false,
        message: 'Prix réduit et durée de remise sont requis.'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable.'
      });
    }

    // Update product with discount information
    product.discountedPrice = parseFloat(discountedPrice);
    product.discountDuration = new Date(discountDuration);
    product.discountPercentage = parseFloat(discountPercentage);

    await product.save();

    res.json({
      success: true,
      message: 'La remise a été appliquée avec succès.',
      product
    });
  } catch (error) {
    console.error('Discount application error:', error);
    res.status(400).json({
      success: false,
      message: "Une erreur est survenue lors de l'ajout de la remise.",
      error: error.message,
    });
  }
});

// Supprimer une remise
router.delete('/:id/discount', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    product.discountedPrice = null;
    product.discountDuration = null;
    await product.save();

    res.json({ message: 'La remise a été supprimée avec succès.', product });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors de la suppression de la remise.', error: error.message });
  }
});

module.exports = router;
