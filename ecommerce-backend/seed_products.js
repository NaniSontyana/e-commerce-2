// ecommerce-backend/seed_products.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Admin = require('./models/admin');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in the environment or .env file.');
  process.exit(1);
}

console.log('Connecting to database to restore/seed products...');
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to database.');

    // --- Restore Products ---
    const backupPath = path.join(__dirname, 'products_backup.json');
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found at: ${backupPath}. Please run backup_products.js first.`);
      mongoose.connection.close();
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    console.log(`Loaded ${backupData.length} products from backup file.`);

    // Clear existing products to prevent duplicates or clean start
    await Product.deleteMany({});
    console.log('Cleared existing products in the database.');

    // Clean products (remove internal _id & __v if we want new ObjectIds, or keep existing ones to preserve relations like reviews/carts)
    // Preserving the original _id is generally better for restoring relations.
    const productsToInsert = backupData.map(prod => {
      // If we want to clean, we can. But keeping _id ensures integrity with existing references.
      return {
        ...prod,
        _id: prod._id ? new mongoose.Types.ObjectId(prod._id.$oid || prod._id) : new mongoose.Types.ObjectId()
      };
    });

    await Product.insertMany(productsToInsert);
    console.log(`Successfully restored ${productsToInsert.length} products into the database.`);

    // --- Seed Default Admin ---
    const adminCount = await Admin.countDocuments({});
    if (adminCount === 0) {
      console.log('No admins found in the database. Seeding a default admin user...');
      const defaultUsername = 'admin';
      const defaultEmail = 'admin@example.com';
      const defaultPassword = 'adminpassword123'; // Change this on first login!

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      const defaultAdmin = new Admin({
        username: defaultUsername,
        email: defaultEmail,
        password: hashedPassword,
        isAdmin: true
      });

      await defaultAdmin.save();
      console.log('--------------------------------------------------');
      console.log('Default Admin Created:');
      console.log(`  Username: ${defaultUsername}`);
      console.log(`  Email:    ${defaultEmail}`);
      console.log(`  Password: ${defaultPassword}`);
      console.log('--------------------------------------------------');
    } else {
      console.log(`Database already has ${adminCount} admin(s). Skipping default admin creation.`);
    }

    mongoose.connection.close();
    console.log('Database restore and seeding process completed successfully!');
  })
  .catch((err) => {
    console.error('Seeding/restore error:', err);
    process.exit(1);
  });
