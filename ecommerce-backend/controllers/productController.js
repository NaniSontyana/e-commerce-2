/* const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

const addProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const {
      name,
      price,
      category,
      stock,
      description,
      offer,
      sizes,
      isActive,
      brand,
      weight,
      weightUnit,
      model,
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !stock || !description) {
      return res.status(400).json({ message: 'Missing required fields: name, price, category, stock, or description' });
    }

    // Handle main image
    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    if (!mainImageFile) {
      return res.status(400).json({ message: 'Main image is required' });
    }

    // Handle additional images
    const additionalImageFiles = req.files && req.files['additionalImages'] ? req.files['additionalImages'] : [];
    const uniqueAdditionalImages = [];
    const seenFilenames = new Set();
    for (const file of additionalImageFiles) {
      if (!seenFilenames.has(file.filename)) {
        seenFilenames.add(file.filename);
        uniqueAdditionalImages.push(file);
      }
    }

    // Construct image paths using BASE_URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const mainImagePath = `${baseUrl}/uploads/${mainImageFile.filename}`;
    const additionalImagePaths = uniqueAdditionalImages.map(file => `${baseUrl}/uploads/${file.filename}`);

    console.log('Main image path:', mainImagePath);
    console.log('Additional image paths:', additionalImagePaths);

    // Create new product
    const product = new Product({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      description,
      image: mainImagePath,
      images: additionalImagePaths,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      brand: brand || '',
      weight: weight ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
    });

    await product.save();
    console.log('Product saved:', product);

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error adding product:', error.stack);
    res.status(500).json({ message: 'Failed to add product', error: error.message });
  }
};

module.exports = { addProduct }; */

/* const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

const addProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const {
      name,
      price,
      category,
      stock,
      description,
      offer,
      sizes,
      isActive,
      brand,
      weight,
      weightUnit,
      model,
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !stock || !description) {
      return res.status(400).json({ message: 'Missing required fields: name, price, category, stock, or description' });
    }

    // Handle main image
    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    if (!mainImageFile) {
      return res.status(400).json({ message: 'Main image is required' });
    }

    // Handle additional images
    const additionalImageFiles = req.files && req.files['additionalImages'] ? req.files['additionalImages'] : [];
    const uniqueAdditionalImages = [];
    const seenFilenames = new Set();
    for (const file of additionalImageFiles) {
      if (!seenFilenames.has(file.filename)) {
        seenFilenames.add(file.filename);
        uniqueAdditionalImages.push(file);
      }
    }

    // Construct image paths
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const mainImagePath = `/uploads/${mainImageFile.filename}`;
    const additionalImagePaths = uniqueAdditionalImages.map(file => `/uploads/${file.filename}`);

    console.log('Main image path:', mainImagePath);
    console.log('Additional image paths:', additionalImagePaths);

    // Create new product
    const product = new Product({
      name,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      description,
      image: mainImagePath,
      images: additionalImagePaths,
      offer: offer || '',
      sizes: sizes ? JSON.parse(sizes) : [],
      isActive: isActive === 'true' || isActive === true,
      brand: brand || '',
      weight: weight ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
    });

    await product.save();
    console.log('Product saved:', product);

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error adding product:', error.stack);
    res.status(50
/* // backend/controllers/productController.js (example)
const addProduct = async (req, res) => {
  const { name, price, category, stock, description, offer, sizes, isActive, brand, weight, weightUnit, model } = req.body;
  const mainImage = req.files['image'][0]; // Main image from 'image' field
  const additionalImages = req.files['images'] || []; // Additional images from 'images' field

  const product = new Product({
    name,
    price,
    category,
    stock,
    description,
    image: `${process.env.BASE_URL}/uploads/${mainImage.filename}`, // Main image URL
    images: additionalImages.map(file => `${process.env.BASE_URL}/uploads/${file.filename}`), // Additional images URLs
    offer,
    sizes: JSON.parse(sizes),
    isActive,
    brand,
    weight,
    weightUnit,
    model,
  });

  await product.save();
  res.status(201).json({ product });
}; */