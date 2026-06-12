import React from 'react';
import { Link } from 'react-router-dom';

const WishlistItem = ({ item, handleRemoveFromWishlist }) => {
  // Define the backend base URL
  const BACKEND_BASE_URL = 'https://backend-ps76.onrender.com';

  // Construct the full image URL
  const imageUrl = item.productId?.image
    ? item.productId.image.startsWith('http')
      ? item.productId.image // If it's already a full URL, use it as is
      : `${BACKEND_BASE_URL}${item.productId.image}` // Prepend the backend base URL
    : '/default-product.jpg';

  console.log('Wishlist item image URL:', imageUrl); // Debug the constructed image URL

  return (
    <div className="wishlist-card">
      <Link to={`/product/${item.productId?._id || 'default'}`} className="wishlist-image-link">
        <img
          src={imageUrl}
          alt={item.productId?.name || 'Product'}
          className="wishlist-image"
          onError={(e) => {
            console.log('Image failed to load, using fallback:', imageUrl);
            e.target.src = '/default-product.jpg';
          }}
        />
      </Link>
      <div className="wishlist-details">
        <Link to={`/product/${item.productId?._id || 'default'}`} className="wishlist-name">
          {item.productId?.name || 'Unknown Product'}
        </Link>
        <p className="wishlist-price">₹{item.productId?.price?.toFixed(2) || 'N/A'}</p>
        <p className="wishlist-category">{item.productId?.category || 'N/A'}</p>
        <div className="wishlist-actions">
          <button
            className="remove-btn"
            onClick={() => handleRemoveFromWishlist(item._id)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;