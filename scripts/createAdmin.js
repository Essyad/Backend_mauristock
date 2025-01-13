const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Önce koleksiyonu temizle
    await Admin.deleteMany({});
    console.log('Mevcut adminler silindi');

    // Yeni admin oluştur
    const admin = new Admin({
      username: 'admin',
      password: 'admin123'
    });

    // Admin'i kaydet
    await admin.save();

    // Kaydedilen admin'i kontrol et
    const savedAdmin = await Admin.findOne({ username: 'admin' });
    console.log('Admin kullanıcısı başarıyla oluşturuldu:', {
      username: savedAdmin.username,
      _id: savedAdmin._id
    });

    // Veritabanı bağlantısını kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
    
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Script'i çalıştır
createAdmin(); 