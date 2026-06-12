// ecommerce-backend/backup_products.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in the environment or .env file.');
  process.exit(1);
}

console.log('Connecting to current database to back up products...');
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to database.');
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database.`);

    const backupPath = path.join(__dirname, 'products_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`Successfully backed up ${products.length} products to: ${backupPath}`);
    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Database connection or backup error:', err);
    process.exit(1);
  });
