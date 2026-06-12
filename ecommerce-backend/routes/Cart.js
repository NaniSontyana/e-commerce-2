const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate(
      'items.productId',
      'name price image images variants sizes category subcategory nestedCategory description brand weight weightUnit model offer dealTag seller specifications warranty packOf stock'
    );
    if (!cart) {
      return res.json({ cart: { items: [] } });
    }
    console.log('Fetched cart response:', cart);
    res.json({ cart });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add a product to the cart
router.post('/add', auth, async (req, res) => {
  try {
    console.log('Add to cart request:', req.body);
    const { productId, quantity, size, variantId } = req.body;

    // Validate productId
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid product ID:', productId);
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Fetch the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate size if provided
    if (size) {
      if (!product.sizes || !product.sizes.includes(size)) {
        return res.status(400).json({ message: `Invalid size: ${size}. Available sizes: ${product.sizes.join(', ')}` });
      }
    }

    // Validate variantId if provided
    if (variantId) {
      if (!product.variants || !product.variants.some((v) => v.variantId === variantId)) {
        return res.status(400).json({ message: 'Invalid variant ID' });
      }
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} available.` });
    }

    // Find or create the cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if the item (with the same productId, size, and variantId) already exists in the cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.size === (size || null) &&
        item.variantId === (variantId || null)
    );

    if (itemIndex > -1) {
      // If the item exists with the same size and variant, increment the quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Otherwise, add a new item with the specified size and variant
      cart.items.push({ productId, quantity, size: size || null, variantId: variantId || null });
    }

    await cart.save();

    // Populate the cart with detailed product info
    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image images variants sizes category subcategory nestedCategory description brand weight weightUnit model offer dealTag seller specifications warranty packOf stock'
    );
    console.log('Populated cart response:', populatedCart);
    res.json({ message: 'Product added to cart', cart: populatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
});

// Remove an item from the cart
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: `Invalid item ID: ${itemId}` });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image images variants sizes category subcategory nestedCategory description brand weight weightUnit model offer dealTag seller specifications warranty packOf stock'
    );
    console.log('Populated cart response after removal:', populatedCart);
    res.json({ message: 'Item removed from cart', cart: populatedCart || { items: [] } });
  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update item quantity
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: `Invalid item ID: ${itemId}` });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(cart.items[itemIndex].productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ message: `Cannot update quantity. Only ${product.stock} in stock.` });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      'items.productId',
      'name price image images variants sizes category subcategory nestedCategory description brand weight weightUnit model offer dealTag seller specifications warranty packOf stock'
    );
    console.log('Populated cart response after update:', populatedCart);
    res.json({ message: 'Quantity updated', cart: populatedCart });
  } catch (err) {
    console.error('Error updating item quantity:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Clear the cart
router.delete('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.json({ message: 'Cart cleared', cart: { items: [] } });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: 'Cart cleared', cart: { items: [] } });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;













































