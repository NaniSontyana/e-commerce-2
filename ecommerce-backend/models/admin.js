const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Added username
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: true }, // Default to true for Admin model
}, { timestamps: true }); // Added timestamps for createdAt and updatedAt

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema); // Prevent overwrite






























































