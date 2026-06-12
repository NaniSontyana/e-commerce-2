const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const Product = require('./models/Product');
    const products = await Product.find({});
    
    let localMainImagesCount = 0;
    let localAdditionalImagesCount = 0;
    let totalProductsWithLocalImages = 0;

    for (const p of products) {
      let hasLocal = false;
      if (p.image && p.image.startsWith('/uploads/')) {
        localMainImagesCount++;
        hasLocal = true;
      }
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          if (img && img.startsWith('/uploads/')) {
            localAdditionalImagesCount++;
            hasLocal = true;
          }
        }
      }
      if (hasLocal) {
        totalProductsWithLocalImages++;
      }
    }

    console.log(`Total products: ${products.length}`);
    console.log(`Products with local images: ${totalProductsWithLocalImages}`);
    console.log(`Local main images: ${localMainImagesCount}`);
    console.log(`Local additional images: ${localAdditionalImagesCount}`);

    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
