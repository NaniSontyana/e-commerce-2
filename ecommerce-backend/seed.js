// ecommerce-backend/seed.js
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch((err) => console.log('MongoDB connection error:', err));

const seedProducts = async () => {
  await Product.deleteMany(); // Clear existing products

  const products = [
    {
      name: 'Laptop',
      price: 999,
      stock: 10,
      image: 'http://localhost:5001/uploads/laptop.jpg',
      category: 'Electronics',
      featured: true,
      specifications: { brand: 'BrandA', model: 'X123' },
      description: 'A high-performance laptop.',
      images: ['http://localhost:5001/uploads/laptop1.jpg', 'http://localhost:5001/uploads/laptop2.jpg'],
    },
    {
      name: 'Phone',
      price: 499,
      stock: 5,
      image: 'http://localhost:5001/uploads/phone.jpg',
      category: 'Electronics',
      featured: false,
      specifications: { brand: 'BrandB', model: 'Y456' },
      description: 'A sleek smartphone.',
      images: ['http://localhost:5001/uploads/phone1.jpg', 'http://localhost:5001/uploads/phone2.jpg'],
    },
  ];

  await Product.insertMany(products);
  console.log('Products seeded successfully');
  mongoose.connection.close();
};

seedProducts();