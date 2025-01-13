const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    const admin = await Admin.findOne({ username: 'admin' });
    console.log('Bulunan admin:', admin);

    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    process.exit();
  }
}

checkAdmin(); 