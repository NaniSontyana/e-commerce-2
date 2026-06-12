import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItem from './CartItem';
import '../styles/Cart.css';

function Cart() {
  const { user, loading: authLoading } = useAuth();
  const { cart: rawCart, removeFromCart, updateQuantity, clearCart, applyCoupon, coupon, calculateSubtotal, calculateTotal } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // State for selected items

  // Ensure cart is always an array, even if undefined
  const cart = Array.isArray(rawCart) ? rawCart : [];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let timer;
    if (cart.length === 0 && !authLoading) {
      timer = setTimeout(() => navigate('/products'), 5000);
    }
    return () => clearTimeout(timer);
  }, [cart, navigate, authLoading]);

  // Calculate subtotal first
  const subtotal = calculateSubtotal();
  // Now use subtotal to calculate deliveryFee
  const deliveryFee = subtotal < 500 ? 5.00 : 0; // Free delivery if subtotal >= ₹500
  const finalTotal = calculateTotal() + deliveryFee;

  const handleApplyCoupon = () => {
    try {
      applyCoupon(couponCode);
      setCouponCode('');
    } catch (err) {
      toast.error('Failed to apply coupon.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setSelectedItems([]);
    } catch (err) {
      toast.error('Failed to clear cart.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleBulkRemove = async () => {
    try {
      for (const itemId of selectedItems) {
        await removeFromCart(itemId);
      }
      setSelectedItems([]);
      toast.success('Selected items removed.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      toast.error('Failed to remove selected items.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cart.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { subtotal, discount: coupon ? coupon.discount / 100 : 0, total: finalTotal } });
  };

  if (authLoading) {
    return (
      <div className="cart-container my-5 text-center cart-loading">
        <h1 className="cart-title">My Cart</h1>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="cart-container my-5 py-5">
      <h1 className="cart-title">My Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</h1>
      {cart.length > 0 ? (
        <div className="cart-content">
          {/* Cart Items */}
          <section className="cart-items">
            <div className="cart-items-header">
              <input
                type="checkbox"
                checked={selectedItems.length === cart.length && cart.length > 0}
                onChange={handleSelectAll}
              />
              <span>Select All ({selectedItems.length}/{cart.length})</span>
              {selectedItems.length > 0 && (
                <button onClick={handleBulkRemove} className="bulk-remove-btn">
                  Remove Selected
                </button>
              )}
            </div>
            {cart.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                navigate={navigate}
                isSelected={selectedItems.includes(item._id)}
                onSelect={() => handleSelectItem(item._id)}
              />
            ))}
          </section>

          {/* Price Summary */}
          <aside className="cart-summary">
            <h2 className="summary-title">PRICE DETAILS</h2>
            <div className="coupon-section">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button onClick={handleApplyCoupon} className="apply-btn">Apply</button>
              {coupon && <p className="coupon-success">{coupon.discount}% Off Applied!</p>}
            </div>
            <div className="total-section ">
              <div className="total-line">
                <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="total-line discount-line">
                  <span>Discount ({coupon.discount}%)</span>
                  <span>-₹{(subtotal * (coupon.discount / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Platform Fee</span>
                <span>₹3.00</span>
              </div>
              <div className="total-line">
                <span>Delivery Charges</span>
                <span className={deliveryFee > 0 ? '' : 'free-delivery'}>₹{deliveryFee.toFixed(2)}{deliveryFee === 0 && ' Free'}</span>
              </div>
            </div>
            {coupon && (
              <p className="savings-message">
                You will save ₹{(subtotal * (coupon.discount / 100)).toFixed(2)} on this order
              </p>
            )}
            {subtotal < 500 && (
              <p className="free-delivery-threshold">
                Add ₹{(500 - subtotal).toFixed(2)} more to get free delivery
              </p>
            )}
            <div className="secure-payment ">
              <i className="fas fa-shield-alt"></i>
              <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
            </div>
            {/* Sticky Footer Container for Mobile */}
            <div className="sticky-footer">
              <div className="total-line final-total">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} className="place-order-btn">Place Order</button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-cart">
          <div className="void-spinner">
            <img
              src="https://img.freepik.com/premium-vector/shopping-ecommerce-graphic-design-with-icons_24911-20665.jpg"
              alt="Empty Cart"
              className="void-image"
              onError={(e) => {
                e.target.src = 'https://placehold.co/150x150';
                e.target.style.display = 'block';
              }}
            />
          </div>
          <p>Your cart is empty! Exploring in 5 seconds...</p>
          <button onClick={() => navigate('/products')} className="explore-btn">Explore Now</button>
        </div>
      )}
    </div>
  );
}

export default Cart;























