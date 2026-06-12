const mongoose = require('mongoose');
const Product = require('./models/Product');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

const cloudinaryUrl = process.env.CLOUDINARY_URL || `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`;
cloudinary.config(cloudinaryUrl ? { url: cloudinaryUrl } : {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-own', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateImages = async () => {
  const products = await Product.find();
  for (const product of products) {
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', product.image);
      try {
        const buffer = await fs.readFile(imagePath);
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(buffer);
        });
        product.image = result.secure_url;
      } catch (err) {
        console.error(`Failed to migrate main image for product ${product._id}:`, err.message);
      }
    }
    if (product.images && product.images.length > 0) {
      const newImages = await Promise.all(
        product.images.map(async (img) => {
          if (img.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', img);
            try {
              const buffer = await fs.readFile(imagePath);
              const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }).end(buffer);
              });
              return result.secure_url;
            } catch (err) {
              console.error(`Failed to migrate additional image ${img} for product ${product._id}:`, err.message);
              return img;
            }
          }
          return img;
        })
      );
      product.images = newImages;
    }
    await product.save();
    console.log(`Migrated product ${product._id}`);
  }
  console.log('Migration completed');
  mongoose.connection.close();
};

migrateImages().catch(console.error);