const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || process.env.Jwt_Secret || 'ReB1GbhL1I';

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => { 
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    req.user = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
    }
    res.status(401).json({ message: 'Unauthorized: Token verification failed', error: err.message });
  }
};

// Admin registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields (username, email, password) are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, isAdmin: admin.isAdmin }, jwtSecret, { expiresIn: '6h' });

    // Return success response with token
    res.status(201).json({ message: 'Admin registered successfully', token });
  } catch (err) {
    console.error('Admin Register Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, isAdmin: admin.isAdmin || false }, jwtSecret, { expiresIn: '6h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin dashboard (example)
router.get('/dashboard', verifyAdmin, (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard', admin: req.user });
});

// Export router and verifyAdmin
module.exports = { router, verifyAdmin };



















