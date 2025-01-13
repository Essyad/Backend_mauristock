const dotenv = require('dotenv');
const path = require('path');

// .env dosyasının yolunu tam olarak belirtelim
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const companyRoutes = require('./routes/companies');
const subcategoryRoutes = require('./routes/subcategories');


const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: true,
})
.then(() => {
  console.log('MongoDB marche corectement');
})
.catch((err) => {
  console.error("MongoDB Il s'ajit d'un erreur :", err.message);
  process.exit(1);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/subcategories', subcategoryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'حدث خطأ في النظام' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server travail sur la porte ${PORT} `);
});
