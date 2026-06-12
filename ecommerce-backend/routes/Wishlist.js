
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');

// Get user's wishlist
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure the authenticated user is accessing their own wishlist
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Fetch the wishlist and populate the product details
    const wishlist = await Wishlist.find({ userId })
      .populate('productId', 'name price image category') // Populate only necessary fields
      .lean();

    res.json(wishlist);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ message: 'Failed to fetch wishlist', error: err.message });
  }
});

// Add a product to wishlist
/* router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Check if the product is already in the wishlist
    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Create a new wishlist entry
    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    // Populate the product details in the response
    const populatedItem = await Wishlist.findById(wishlistItem._id)
      .populate('productId', 'name price image category')
      .lean();

    res.status(201).json({ message: 'Added to wishlist', item: populatedItem });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ message: 'Failed to add to wishlist', error: err.message });
  }
}); */


/* const handleAddToWishlist = async (productId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      'http://localhost:5001/api/wishlist',
      { productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Added to wishlist response:', res.data); // Debug the response
    setWishlist([...wishlist, res.data.item]);
    setWishlistMessages((prev) => ({
      ...prev,
      [productId]: 'Added to wishlist!',
    }));
    toast.success('Added to wishlist!');
    setTimeout(() => {
      setWishlistMessages((prev) => ({
        ...prev,
        [productId]: '',
      }));
    }, 3000);
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    const errorMessage = err.response?.data?.message || 'Failed to add to wishlist.';
    setError(errorMessage);
    toast.error(errorMessage);
  }
}; */



router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id; // From authMiddleware

    // Validate productId
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    // Check if the item is already in the wishlist
    const existingItem = await Wishlist.findOne({ userId, productId });
    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist.' });
    }

    // Create new wishlist item
    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    // Populate the productId field for the response
    const populatedItem = await Wishlist.findById(wishlistItem._id)
      .populate('productId', 'name price image category')
      .lean();

    res.status(201).json({ message: 'Added to wishlist.', item: populatedItem });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ message: 'Failed to add to wishlist.', error: err.message });
  }
});


// Remove a product from wishlist
router.delete('/:wishlistId', authMiddleware, async (req, res) => {
  try {
    const { wishlistId } = req.params;
    const userId = req.user.id;

    // Validate wishlistId
    if (!mongoose.Types.ObjectId.isValid(wishlistId)) {
      return res.status(400).json({ message: 'Invalid wishlist ID' });
    }

    // Find and delete the wishlist item
    const wishlistItem = await Wishlist.findOneAndDelete({ _id: wishlistId, userId });
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found or unauthorized' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    res.status(500).json({ message: 'Failed to remove from wishlist', error: err.message });
  }
});

// Clear user's wishlist
router.delete('/user/:userId/clear', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure the authenticated user is clearing their own wishlist
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Delete all wishlist items for the user
    await Wishlist.deleteMany({ userId });
    res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Error clearing wishlist:', err);
    res.status(500).json({ message: 'Failed to clear wishlist', error: err.message });
  }
});

module.exports = router;










































































