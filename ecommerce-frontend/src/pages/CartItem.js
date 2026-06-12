import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../styles/CartItem.css';

function CartItem({ item, removeFromCart, updateQuantity, navigate, isSelected, onSelect }) {
  const { user, logout } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleProductClick = () => {
    navigate(`/product/${item.productId?._id || item._id}`);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromCart(item._id);
    } catch (err) {
      console.error('Error during removal:', err);
      if (err.response?.status === 401) {
        await logout();
        navigate('/login');
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error('Failed to remove item.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleIncrease = async () => {
    setIsUpdating(true);
    try {
      // Assuming item.productId.stock holds the available stock
      if (item.productId?.stock && item.quantity >= item.productId.stock) {
        toast.warn('Maximum stock reached!', {
          position: 'bottom-left',
          autoClose: 3000,
        });
        return;
      }
      await updateQuantity(item._id, item.quantity + 1);
    } catch (err) {
      toast.error('Failed to increase quantity.', {
        position: 'top-right',
        autoClose: 3000,
      });
      console.error('Failed to increase quantity:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrease = async () => {
    if (item.quantity <= 1) {
      await handleRemove();
      return;
    }
    setIsUpdating(true);
    try {
      await updateQuantity(item._id, item.quantity - 1);
    } catch (err) {
      toast.error('Failed to decrease quantity.', {
        position: 'top-right',
        autoClose: 3000,
      });
      console.error('Failed to decrease quantity:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get variant color if available
  const variantColor = item.selectedVariant?.specifications?.color || 'N/A';

  return (
    <div className="cart-item">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="cart-item-checkbox"
        aria-label={`Select ${item.productId?.name || 'product'} for checkout`}
      />
      <div className="cart-item-image" onClick={handleProductClick}>
        <img
          src={item.selectedVariant?.mainImage || item.productId?.image || 'https://placehold.co/100x100?text=No+Image'}
          alt={item.productId?.name || 'Product'}
          onError={(e) => {
            e.target.src = 'https://placehold.co/100x100?text=No+Image';
          }}
        />
      </div>
      <div className="cart-item-details">
        <h5 onClick={handleProductClick}>{item.productId?.name || 'Unknown Product'}</h5>
        <p className="seller-info">Seller: RetailNet</p>
        {item.size && (
          <p className="variant-info">Size: {item.size}</p>
        )}
        {item.variantId && (
          <p className="variant-info">Color: {variantColor}</p>
        )}
        {item.inStock !== false ? (
          <div className="price-section">
            <span className="price">₹{Number(item.productId?.price || 0).toFixed(2)}</span>
            <span className="original-price">₹{(Number(item.productId?.price || 0) * 1.9).toFixed(2)}</span>
            <span className="discount">90% off</span>
          </div>
        ) : (
          <p className="out-of-stock">Out of Stock</p>
        )}
        <div className="quantity-section">
          <button
            onClick={handleDecrease}
            disabled={isUpdating || item.inStock === false}
            aria-label="Decrease quantity"
          >
            {isUpdating ? '...' : '-'}
          </button>
          <span>{item.quantity}</span>
          <button
            onClick={handleIncrease}
            disabled={isUpdating || item.inStock === false}
            aria-label="Increase quantity"
          >
            {isUpdating ? '...' : '+'}
          </button>
        </div>
        <div className="cart-item-actions">
          <button
            onClick={handleRemove}
            className="action-btn"
            disabled={isRemoving}
            aria-label="Remove item from cart"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;









































