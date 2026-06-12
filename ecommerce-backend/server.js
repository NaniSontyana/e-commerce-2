const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cloudinary = require('cloudinary').v2;

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://localhost:5001', 'http://localhost:5003', 'http://localhost:5004', 'https://backend-ps76.onrender.com', 'https://frontend-8uy4.onrender.com', 'https://admin-frontend-o3u7.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// Set BASE_URL environment variable
process.env.BASE_URL = process.env.BASE_URL || (process.env.RENDER ? 'https://backend-ps76.onrender.com' : 'http://localhost:5001');

// Configure Cloudinary
if (!process.env.CLOUDINARY_URL) {
  console.error('CLOUDINARY_URL not found in .env file');
  process.exit(1);
}
console.log('Cloudinary URL loaded:', process.env.CLOUDINARY_URL);

// MongoDB Connection (removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/Cart');
const customerRoutes = require('./routes/customer');
const { router: adminRouter } = require('./routes/admin');
const productRoutes = require('./routes/products');
const { router: orderRouter } = require('./routes/orders');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const Wishlist = require('./routes/Wishlist');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRoutes);
app.use('/api', customerRoutes);
app.use('/api/wishlist', Wishlist);
app.use('/api/reviews', reviewRoutes);

// Map /api/checkout to /api/orders/create-session for Stripe session creation
app.use('/api/checkout', (req, res, next) => {
  console.log('Received request at /api/checkout, redirecting to /create-session:', req.body);
  req.url = '/create-session';
  orderRouter(req, res, next);
});

// Root Route
app.get('/', (req, res) => {
  res.send('E-commerce Backend is running on port 5001');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
























/* const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://localhost:5001', 'http://localhost:5003', 'http://localhost:5004', 'https://backend-ps76.onrender.com', 'https://frontend-8uy4.onrender.com', 'https://admin-frontend-o3u7.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// Set BASE_URL environment variable
process.env.BASE_URL = process.env.BASE_URL || (process.env.RENDER ? 'https://backend-ps76.onrender.com' : 'http://localhost:5001');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/Cart');
const customerRoutes = require('./routes/customer');
const { router: adminRouter } = require('./routes/admin');
const productRoutes = require('./routes/products');
const { router: orderRouter } = require('./routes/orders');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const Wishlist = require('./routes/Wishlist');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', userRoutes);
app.use('/api', customerRoutes);
app.use('/api/wishlist', Wishlist);
app.use('/api/reviews', reviewRoutes);

// Map /api/checkout to /api/orders/create-session for Stripe session creation
app.use('/api/checkout', (req, res, next) => {
  console.log('Received request at /api/checkout, redirecting to /create-session:', req.body);
  req.url = '/create-session';
  orderRouter(req, res, next);
});

// Root Route
app.get('/', (req, res) => {
  res.send('E-commerce Backend is running on port 5001');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); */



















/* 

 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS
 app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5002', 'http://localhost:5001','http://localhost:5003', 'http://localhost:5004','https://backend-ps76.onrender.com','https://frontend-8uy4.onrender.com','https://admin-frontend-o3u7.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); 

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/Cart');
const customerRoutes = require('./routes/customer');
const { router: adminRouter } = require('./routes/admin');
const productRoutes = require('./routes/products');
const { router: orderRouter } = require('./routes/orders'); // Ensure orders router is correctly destructured
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const Wishlist=require('./routes/Wishlist')
// Note: Removing or commenting out checkoutRoutes for now since it might be causing conflicts
// const checkoutRoutes = require('./routes/checkout');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', adminRouter);
app.use('/api/orders', orderRouter); // Main orders route
app.use('/api/users', userRoutes);
app.use('/api', customerRoutes); // Moved to the end to avoid conflicts
app.use('/api/wishlist', Wishlist);
app.use('/api/reviews', reviewRoutes); 

 

// Map /api/checkout to /api/orders/create-session for Stripe session creation
app.use('/api/checkout', (req, res, next) => {
  console.log('Received request at /api/checkout, redirecting to /create-session:', req.body);
  req.url = '/create-session'; // Redirect to the create-session endpoint in orders.js
  orderRouter(req, res, next);
});

// Root Route
app.get('/', (req, res) => {
  res.send('E-commerce Backend is running on port 5001');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
 */
 