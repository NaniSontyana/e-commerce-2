
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Helper function to format user response
const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  address: user.address || '', // Legacy address field
  avatar: user.avatar || '',
  isAdmin: user.isAdmin,
  paymentMethods: user.paymentMethods || [],
  shippingAddress: user.shippingAddress || {}, // Added shippingAddress
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(formatUserResponse(user));
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, address } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, address },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user: formatUserResponse(user) });
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New route to save shipping address
router.put('/profile/shipping-address', authMiddleware, async (req, res) => {
  try {
    const { fullName, address, city, postalCode, country, phoneNumber } = req.body;

    // Validate required fields (at least address should be provided)
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's shipping address
    user.shippingAddress = {
      fullName: fullName?.trim(),
      address: address.trim(),
      city: city?.trim(),
      postalCode: postalCode?.trim(),
      country: country?.trim(),
      phoneNumber: phoneNumber?.trim(),
    };

    await user.save();
    res.json({ message: 'Shipping address updated successfully', shippingAddress: user.shippingAddress });
  } catch (error) {
    console.error('Error updating shipping address:', error);
    res.status(500).json({ message: 'Failed to update shipping address', error: error.message });
  }
});

// Upload avatar
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const avatarPath = `/uploads/${req.file.filename}`; // Relative path
    user.avatar = avatarPath; // Store relative path
    await user.save();

    res.json({ user: formatUserResponse(user) });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
});

// Get all payment methods
router.get('/profile/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ paymentMethods: user.paymentMethods || [] });
  } catch (error) {
    console.error('Get Payment Methods Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new payment method
router.post('/profile/payment-methods', authMiddleware, async (req, res) => {
  try {
    const { cardNumber, expiry, name } = req.body;
    if (!cardNumber || !expiry || !name) {
      return res.status(400).json({ message: 'All payment fields are required' });
    }
    const cardNumberCleaned = cardNumber.replace(/\D/g, '');
    if (cardNumberCleaned.length < 13 || cardNumberCleaned.length > 19) {
      return res.status(400).json({ message: 'Invalid card number' });
    }
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      return res.status(400).json({ message: 'Expiry must be in MM/YY format' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.paymentMethods = user.paymentMethods || [];
    user.paymentMethods.push({ cardNumber: cardNumberCleaned, expiry, name, _id: new mongoose.Types.ObjectId() });
    await user.save();
    res.json({ message: 'Payment method added', paymentMethods: user.paymentMethods });
  } catch (error) {
    console.error('Add Payment Method Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid payment method data', error: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payment method
router.delete('/profile/payment-methods/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const paymentExists = user.paymentMethods.some((method) => method._id.toString() === paymentId);
    if (!paymentExists) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    user.paymentMethods = user.paymentMethods.filter((method) => method._id.toString() !== paymentId);
    await user.save();
    res.json({ message: 'Payment method deleted', paymentMethods: user.paymentMethods });
  } catch (error) {
    console.error('Delete Payment Method Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update password
router.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    // Update password (pre-save middleware will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully. Please log in again.' });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;




































































