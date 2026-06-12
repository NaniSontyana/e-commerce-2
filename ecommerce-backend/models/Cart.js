const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      variantId: {
        type: String, // Matches the variantId format (e.g., timestamp string) from the Product model
        default: null, // Optional, null if no variant is selected
      },
      size: {
        type: String, // Store the selected size (e.g., 'M', '32')
        default: null, // Optional, null if no size is selected
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);









































 
