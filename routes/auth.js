const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

// Connexion Admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      expiresIn: 24 * 60 * 60 * 1000,
      username: admin.username
    });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue dans le système.' });
  }
});

// Mise à jour des informations d'admin
router.post('/update-admin', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, newUsername } = req.body;
    
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin introuvable.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Le mot de passe actuel est incorrect.' });
    }

    const updates = {};
    
    if (newUsername) {
      updates.username = newUsername;
    }
    
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.adminId,
      { $set: updates },
      { new: true }
    );

    const token = jwt.sign(
      { id: updatedAdmin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Mise à jour réussie.',
      token,
      username: updatedAdmin.username
    });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors de la mise à jour.' });
  }
});

module.exports = router;
