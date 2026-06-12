const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
  price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
  image: { type: String, trim: true },
  size: { type: String, trim: true, default: '' }, // Added to store selected size
  variantId: { type: String, trim: true, default: '' }, // Added to store variant ID
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, trim: true },
    address: { type: String, required: [true, 'Shipping address is required'], trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
  },
  payment: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Payment information is required'],
    validate: {
      validator: function (v) {
        if (typeof v === 'string') return true;
        if (v && typeof v.cardNumber === 'string' && typeof v.expiry === 'string') return true;
        if (v && typeof v.method === 'string') return true;
        return false;
      },
      message: 'Invalid payment format',
    },
  },
  total: { type: Number, required: [true, 'Total amount is required'], min: [0, 'Total cannot be negative'] },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'],
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  stripeSessionId: { type: String },
});

orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);

























