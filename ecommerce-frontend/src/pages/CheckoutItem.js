import React from 'react';
import '../styles/CheckoutItem.css';

function CheckoutItem({ item, handleQuantityChange }) {
  // Log the item to debug the fields
  console.log('Checkout item:', item);

  const handleIncrease = () => {
    handleQuantityChange(item, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      handleQuantityChange(item, item.quantity - 1);
    }
  };

  // Get variant color if available
  const variantColor = item.selectedVariant?.specifications?.color || 'N/A';

  return (
    <div className="checkout-item">
      <img
        src={item.selectedVariant?.mainImage || item.productId?.image || 'https://placehold.co/50?text=No+Image'}
        alt={item.productId?.name || 'Product'}
        className="checkout-item-image"
        onError={(e) => {
          e.target.src = 'https://placehold.co/50?text=No+Image';
          e.target.style.display = 'block';
        }}
      />
      <div className="checkout-item-details">
        <h3>{item.productId?.name || 'Unknown Product'}</h3>
        {item.size && (
          <p className="variant-info">Size: {item.size}</p>
        )}
        {item.variantId && (
          <p className="variant-info">Color: {variantColor}</p>
        )}
        <p className="price-info">Price: ₹{item.productId?.price?.toFixed(2) || 0}</p>
        {item.productId?.stock && (
          <p className={`stock-info ${item.productId.stock <= 5 ? 'low-stock' : ''}`}>
            {item.productId.stock <= 5 ? `Hurry! Only ${item.productId.stock} left!` : `In Stock: ${item.productId.stock}`}
          </p>
        )}
        <div className="quantity-controls">
          <button
            onClick={handleDecrease}
            disabled={item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.productId?.name || 'product'}`}
          >
            -
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={handleIncrease}
            disabled={item.productId?.stock && item.quantity >= item.productId.stock}
            aria-label={`Increase quantity of ${item.productId?.name || 'product'}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutItem;