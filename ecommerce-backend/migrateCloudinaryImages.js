const mongoose = require('mongoose');
const Product = require('./models/Product');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
require('dotenv').config();

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error('Error: CLOUDINARY_URL is not defined in the environment or .env file.');
  process.exit(1);
}

// Parse Cloudinary URL: cloudinary://key:secret@cloud_name
const matches = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (!matches) {
  console.error('Error: Invalid CLOUDINARY_URL format.');
  process.exit(1);
}

const apiKey = matches[1];
const apiSecret = matches[2];
const newCloudName = matches[3];

console.log(`Configuring Cloudinary for cloud: ${newCloudName}`);
cloudinary.config({
  cloud_name: newCloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in the environment or .env file.');
  process.exit(1);
}

const isExternalCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // If it's a Cloudinary URL but not from our new cloud name
  return url.includes('res.cloudinary.com/') && !url.includes(`res.cloudinary.com/${newCloudName}/`);
};

const uploadUrlToCloudinary = async (oldUrl) => {
  try {
    console.log(`Downloading external image: ${oldUrl}`);
    const response = await fetch(oldUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    
    console.log(`Uploading to new Cloudinary account...`);
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });
    
    console.log(`Uploaded successfully! New URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to migrate image ${oldUrl}:`, error.message);
    return oldUrl; // Fallback to original URL on failure
  }
};

const migrate = async () => {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check.`);

  let totalMigrated = 0;

  for (const product of products) {
    let updated = false;

    // 1. Migrate main image
    if (isExternalCloudinaryUrl(product.image)) {
      const newUrl = await uploadUrlToCloudinary(product.image);
      if (newUrl !== product.image) {
        product.image = newUrl;
        updated = true;
      }
    }

    // 2. Migrate additional images array
    if (product.images && product.images.length > 0) {
      const newImages = [];
      for (const img of product.images) {
        if (isExternalCloudinaryUrl(img)) {
          const newUrl = await uploadUrlToCloudinary(img);
          newImages.push(newUrl);
          if (newUrl !== img) {
            updated = true;
          }
        } else {
          newImages.push(img);
        }
      }
      product.images = newImages;
    }

    // 3. Migrate variants
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        // Main image in variant
        if (isExternalCloudinaryUrl(variant.mainImage)) {
          const newUrl = await uploadUrlToCloudinary(variant.mainImage);
          if (newUrl !== variant.mainImage) {
            variant.mainImage = newUrl;
            updated = true;
          }
        }
        // Additional images in variant
        if (variant.additionalImages && variant.additionalImages.length > 0) {
          const newAdditional = [];
          for (const img of variant.additionalImages) {
            if (isExternalCloudinaryUrl(img)) {
              const newUrl = await uploadUrlToCloudinary(img);
              newAdditional.push(newUrl);
              if (newUrl !== img) {
                updated = true;
              }
            } else {
              newAdditional.push(img);
            }
          }
          variant.additionalImages = newAdditional;
        }
      }
    }

    if (updated) {
      await product.save();
      console.log(`Product ${product.name} (${product._id}) updated with new Cloudinary URLs.`);
      totalMigrated++;
    }
  }

  console.log(`Migration complete! Migrated ${totalMigrated} products.`);
  mongoose.connection.close();
};

migrate().catch(console.error);
