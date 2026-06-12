const mongoose = require('mongoose');
require('dotenv').config();

console.log('Connecting to:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check if Product collection exists and get count
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    console.log('Number of products in DB:', count);
    
    if (count > 0) {
      const sample = await Product.findOne();
      console.log('Sample product:', sample);
    }
    
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });
