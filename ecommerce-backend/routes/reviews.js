const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// Create a new review for a specific product in an order
router.post('/:orderId/:productId', auth, async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    console.log('Review submission request:', { orderId, productId, body: req.body });

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid order ID or product ID' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = new Review({
      orderId: new mongoose.Types.ObjectId(orderId),
      productId: new mongoose.Types.ObjectId(productId),
      userId: req.user.id,
      rating,
      comment,
    });
    await review.save();

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
});

// Get a review for a specific product in an order
router.get('/order/:orderId/product/:productId', auth, async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid order ID or product ID' });
    }

    const review = await Review.findOne({ orderId, productId, userId: req.user.id });
    res.json(review || {});
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Failed to fetch review', error: error.message });
  }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid Review ID' });
    }

    const review = await Review.findOne({ _id: reviewId, userId: req.user.id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or you are not authorized to edit this review' });
    }

    review.rating = rating;
    review.comment = comment;
    review.updatedAt = Date.now();

    const updatedReview = await review.save();
    res.json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid Review ID' });
    }

    const review = await Review.findOneAndDelete({ _id: reviewId, userId: req.user.id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or you are not authorized to delete this review' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

// Get all reviews for a product (used by ProductDetails.js)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Log the data before sending
    console.log('Sending reviews:', reviews);

    // Explicitly send the array
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Failed to fetch product reviews', error: error.message });
  }
});

// Get a specific review for an order and product (used by Orders.js)
router.get('/order/:orderId/product/:productId', auth, async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid Order ID or Product ID' });
    }

    const review = await Review.findOne({
      orderId,
      productId,
      userId: req.user.id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ message: 'Failed to fetch review', error: error.message });
  }
});

module.exports = router;











































