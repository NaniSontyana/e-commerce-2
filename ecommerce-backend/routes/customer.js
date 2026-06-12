// ecommerce-backend/routes/customer.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Public route to fetch products (no authentication needed)
router.get('/products', async (req, res) => {
  try {
    console.log('Fetching products from database...');
    const products = await Product.find();
    console.log('Fetched products:', products);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products in customer route:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Optional: Re-add the old routes if needed
router.get('/', async (req, res) => {
  try {
    console.log('Fetching active products from database...');
    const products = await Product.find({ isActive: true });
    console.log('Fetched active products:', products);
    res.json(products);
  } catch (err) {
    console.error('Error fetching active products in customer route:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching product with ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product.isActive) {
      return res.status(404).json({ message: 'Product is inactive' });
    }
    console.log('Fetched product:', product);
    res.json(product);
  } catch (err) {
    console.error('Error fetching product by ID in customer route:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;





























