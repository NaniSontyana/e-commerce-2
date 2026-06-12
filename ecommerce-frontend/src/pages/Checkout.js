import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutItem from '../pages/CheckoutItem';
import '../styles/Checkout.css';

const stripePromise = loadStripe('pk_test_51PwKUJL4Eh51qnT6VIIEEXuLQQEuAcdbPOXFH36DIQ10wlSmntvODebkaUkfpm3Yn18GKUevcRYbBcHQ1IaOBX6200DmcOugdB');

function Checkout() {
  const { cart, updateQuantity, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subtotal: passedSubtotal, discount: passedDiscount, total: passedTotal } = location.state || {};

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [addressOption, setAddressOption] = useState('new');
  const [savedAddress, setSavedAddress] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-ps76.onrender.com/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedAddress(res.data.shippingAddress || null);
        if (res.data.shippingAddress && addressOption === 'saved') {
          setFormData((prev) => ({
            ...prev,
            fullName: res.data.shippingAddress.fullName || '',
            address: res.data.shippingAddress.address || '',
            city: res.data.shippingAddress.city || '',
            postalCode: res.data.shippingAddress.postalCode || '',
            country: res.data.shippingAddress.country || '',
            phoneNumber: res.data.shippingAddress.phoneNumber || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load saved address. Please enter your address manually.');
      }
    };

    const savedData = JSON.parse(localStorage.getItem('checkoutForm')) || {};
    setFormData((prev) => ({ ...prev, ...savedData }));

    if (user) {
      fetchUserProfile();
      fetchPaymentMethods();
    }
  }, [user, addressOption]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (cart.length === 0 && !isSubmitted) {
      setTimeout(() => navigate('/products'), 3000);
    } else if (user) {
      fetchPaymentMethods();
    }
  }, [cart, user, authLoading, navigate, isSubmitted]);

  useEffect(() => {
    localStorage.setItem('checkoutForm', JSON.stringify(formData));
    const filledFields = Object.values(formData).filter(Boolean).length;
    setProgress((filledFields / 7) * 100);
  }, [formData]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('https://backend-ps76.onrender.com/api/users/profile/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.paymentMethods.length > 0) {
        setSelectedPaymentMethod(res.data.paymentMethods[0]._id);
        setShowNewPaymentForm(false);
      } else {
        setSelectedPaymentMethod('new');
        setShowNewPaymentForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
    }
  };

  const subtotal = passedSubtotal || cart.reduce((sum, item) => sum + (Number(item.productId?.price) || 0) * item.quantity, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const total = passedTotal || (discountedSubtotal + deliveryFee);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressOptionChange = (option) => {
    setAddressOption(option);
    if (option === 'saved' && savedAddress) {
      setFormData((prev) => ({
        ...prev,
        fullName: savedAddress.fullName || '',
        address: savedAddress.address || '',
        city: savedAddress.city || '',
        postalCode: savedAddress.postalCode || '',
        country: savedAddress.country || '',
        phoneNumber: savedAddress.phoneNumber || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fullName: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        phoneNumber: '',
      }));
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const maxStock = item.productId?.stock || 10;
    if (newQuantity <= maxStock) {
      updateQuantity(item._id, newQuantity);
      setError('');
    } else {
      setError(`Cannot add more of ${item.productId?.name || 'this item'}. Only ${maxStock} in stock.`);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim() || !formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim() || !formData.country.trim() || !formData.phoneNumber.trim()) {
      setError('All shipping address fields, including full name and phone number, must be filled');
      return false;
    }
    if (selectedPaymentMethod === 'new') {
      const cardNumberRegex = /^\d{16}$/;
      if (!cardNumberRegex.test(formData.cardNumber)) {
        setError('Card number must be 16 digits');
        return false;
      }
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(formData.expiry)) {
        setError('Expiry must be in MM/YY format');
        return false;
      }
      const cvvRegex = /^\d{3}$/;
      if (!cvvRegex.test(formData.cvv)) {
        setError('CVV must be 3 digits');
        return false;
      }
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentMethod(value);
    setShowNewPaymentForm(value === 'new');
  };


  //main 
/* 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      setError('Cannot place order: Your cart is empty');
      return;
    }

    console.log('Cart data before validation:', cart);
    for (const item of cart) {
      if (!item._id || !item.productId?._id || !item.productId?.name || !item.quantity || !item.productId?.price || !item.productId?.image) {
        console.error('Invalid cart item:', item);
        setError(`Invalid cart item: Missing required fields (id, name, quantity, price, image)`);
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      navigate('/login');
      return;
    }

    if (!user || !user._id) {
      setError('User not authenticated. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitted(true);

      const items = cart.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        price: Number(item.productId.price),
        image: item.selectedVariant?.mainImage || item.productId.image || '',
        size: item.size || '',
        variantId: item.variantId || '',
      }));

      console.log('Items being sent to backend:', items);

      console.log('Creating session for order...');
      const sessionResponse = await axios.post(
        'https://backend-ps76.onrender.com/api/orders/create-session',
        {
          userId: user._id,
          items: cart.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: Math.round(Number(item.productId.price) * 100),
            quantity: item.quantity,
            image: item.selectedVariant?.mainImage || item.productId.image || '',
            size: item.size || '',
            variantId: item.variantId || '',
          })),
          shippingAddress: {
            fullName: formData.fullName.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          total: Math.round(total * 100),
          paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'stripe',
          cardDetails: selectedPaymentMethod === 'new'
            ? {
                cardNumber: formData.cardNumber,
                expiry: formData.expiry,
                cvv: formData.cvv,
              }
            : paymentMethods.find(method => method._id === selectedPaymentMethod),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { sessionId } = sessionResponse.data;
      console.log('Session ID received:', sessionId);

      if (selectedPaymentMethod === 'cod') {
        const orderData = {
          userId: user._id,
          items,
          shippingAddress: {
            fullName: formData.fullName.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            postalCode: formData.postalCode.trim(),
            country: formData.country.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          },
          payment: 'Cash on Delivery',
          total,
          sessionId,
        };

        console.log('Placing COD order:', orderData);
        const response = await axios.post('https://backend-ps76.onrender.com/api/orders', orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('COD Order response:', response.data);

        if (saveAddress) {
          try {
            console.log('Saving shipping address...');
            await axios.put(
              'https://backend-ps76.onrender.com/api/users/profile/shipping-address',
              {
                fullName: formData.fullName.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postalCode: formData.postalCode.trim(),
                country: formData.country.trim(),
                phoneNumber: formData.phoneNumber.trim(),
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log('Shipping address saved successfully');
          } catch (addressError) {
            console.error('Error saving shipping address:', addressError);
            setError('Failed to save shipping address. Please try again later.');
          }
        }

        console.log('Clearing cart and navigating to success...');
        localStorage.removeItem('checkoutForm');
        clearCart();
        navigate(`/success?session_id=${sessionId}`, { replace: true });
      } else {
        console.log('Redirecting to Stripe checkout...');
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
          console.error('Stripe redirect error:', result.error.message);
          setError(result.error.message || 'Failed to redirect to Stripe checkout');
          setIsSubmitted(false);
          navigate('/failure');
        }
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response) {
        console.log('Error response data:', err.response.data);
        setError(err.response.data.message || 'Failed to place order');
      } else if (err.request) {
        console.log('No response received:', err.request);
        setError('No response from server. Please check your network connection.');
      } else {
        console.log('Error setting up request:', err.message);
        setError('An unexpected error occurred: ' + err.message);
      }
      setIsSubmitted(false);
      navigate('/failure');
    }
  }; */


  //testing purpose
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!validateForm()) return;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    setError('Cannot place order: Your cart is empty');
    return;
  }

  console.log('Cart data before validation:', cart);
  for (const item of cart) {
    if (!item._id || !item.productId?._id || !item.productId?.name || !item.quantity || !item.productId?.price || !item.productId?.image) {
      console.error('Invalid cart item:', item);
      setError(`Invalid cart item: Missing required fields (id, name, quantity, price, image)`);
      return;
    }
  }

  const token = localStorage.getItem('token');
  if (!token) {
    setError('No token found');
    navigate('/login');
    return;
  }

  if (!user || !user._id) {
    setError('User not authenticated. Please log in again.');
    navigate('/login');
    return;
  }

  // Pre-validate total amount
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.productId?.price) || 0) * item.quantity, 0);
  const deliveryFee = 5.00;
  const discountedSubtotal = passedDiscount ? subtotal * (1 - passedDiscount) : subtotal;
  const totalInRupees = passedTotal || (discountedSubtotal + deliveryFee);
  const totalInPaise = Math.round(totalInRupees * 100);

  const STRIPE_MAX_AMOUNT_PAISE = 999999999;
  if (totalInPaise > STRIPE_MAX_AMOUNT_PAISE) {
    setError(`Order total exceeds Stripe's maximum limit of ₹9,999,999.99. Please reduce the order amount.`);
    return;
  }

  try {
    setIsSubmitted(true);

    const items = cart.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: Number(item.productId.price), // In rupees
      quantity: item.quantity,
      image: item.selectedVariant?.mainImage || item.productId.image || '',
      size: item.size || '',
      variantId: item.variantId || '',
    }));

    console.log('Items being sent to backend:', items);

    console.log('Creating session for order...');
    const sessionResponse = await axios.post(
      'https://backend-ps76.onrender.com/api/orders/create-session',
      {
        userId: user._id,
        items,
        shippingAddress: {
          fullName: formData.fullName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        },
        total: totalInRupees, // Send in rupees
        paymentMethod: selectedPaymentMethod === 'cod' ? 'cod' : 'stripe',
        cardDetails: selectedPaymentMethod === 'new'
          ? {
              cardNumber: formData.cardNumber,
              expiry: formData.expiry,
              cvv: formData.cvv,
            }
          : paymentMethods.find(method => method._id === selectedPaymentMethod),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { sessionId } = sessionResponse.data;
    console.log('Session ID received:', sessionId);

    if (selectedPaymentMethod === 'cod') {
      const orderData = {
        userId: user._id,
        items,
        shippingAddress: {
          fullName: formData.fullName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        },
        payment: 'Cash on Delivery',
        total: totalInRupees,
        sessionId,
      };

      console.log('Placing COD order:', orderData);
      const response = await axios.post('https://backend-ps76.onrender.com/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('COD Order response:', response.data);

      if (saveAddress) {
        try {
          console.log('Saving shipping address...');
          await axios.put(
            'https://backend-ps76.onrender.com/api/users/profile/shipping-address',
            {
              fullName: formData.fullName.trim(),
              address: formData.address.trim(),
              city: formData.city.trim(),
              postalCode: formData.postalCode.trim(),
              country: formData.country.trim(),
              phoneNumber: formData.phoneNumber.trim(),
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log('Shipping address saved successfully');
        } catch (addressError) {
          console.error('Error saving shipping address:', addressError);
          setError('Failed to save shipping address. Please try again later.');
        }
      }

      console.log('Clearing cart and navigating to success...');
      localStorage.removeItem('checkoutForm');
      clearCart();
      navigate(`/success?session_id=${sessionId}`, { replace: true });
    } else {
      console.log('Redirecting to Stripe checkout...');
      const stripe = await stripePromise;

      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        console.error('Stripe redirect error:', result.error.message);
        setError(result.error.message || 'Failed to redirect to Stripe checkout');
        setIsSubmitted(false);
        navigate('/failure');
      }
    }
  } catch (err) {
    console.error('Error placing order:', err);
    if (err.response) {
      console.log('Error response data:', err.response.data);
      setError(err.response.data.message || 'Failed to place order');
    } else if (err.request) {
      console.log('No response received:', err.request);
      setError('No response from server. Please check your network connection.');
    } else {
      console.log('Error setting up request:', err.message);
      setError('An unexpected error occurred: ' + err.message);
    }
    setIsSubmitted(false);
    navigate('/failure');
  }
};

  if (authLoading) {
    return (
      <div className="checkout-wrapper">
        <div className="loading-container">
          <div className="spinner-orbit"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="checkout-wrapper">
      <div className="header-section">
        <h1 className="checkout-title my-4">Checkout</h1>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <div className="checkout-content">
        <div className="cart-section">
          {cart.length > 0 ? (
            cart.map((item) => (
              <CheckoutItem
                key={item._id}
                item={item}
                handleQuantityChange={handleQuantityChange}
              />
            ))
          ) : (
            <p className="empty-cart">Your cart is empty! Redirecting to products...</p>
          )}
        </div>

        <form className="address-form" onSubmit={handleSubmit}>
          <div className="form-sections">
            <div className="shipping-section">
              <h3 className="form-section-title">Shipping Address</h3>
              {savedAddress && Object.values(savedAddress).some(val => val) && (
                <div className="saved-address-section">
                  <h4>Saved Address:</h4>
                  <ul>
                    {savedAddress.fullName && <li><strong>Full Name:</strong> {savedAddress.fullName}</li>}
                    {savedAddress.address && <li><strong>Address:</strong> {savedAddress.address}</li>}
                    {savedAddress.city && <li><strong>City:</strong> {savedAddress.city}</li>}
                    {savedAddress.postalCode && <li><strong>Postal Code:</strong> {savedAddress.postalCode}</li>}
                    {savedAddress.country && <li><strong>Country:</strong> {savedAddress.country}</li>}
                    {savedAddress.phoneNumber && <li><strong>Phone:</strong> {savedAddress.phoneNumber}</li>}
                  </ul>
                  <div className="address-options">
                    <button
                      type="button"
                      className={`address-option-btn ${addressOption === 'saved' ? 'active' : ''}`}
                      onClick={() => handleAddressOptionChange('saved')}
                      aria-label="Use saved address"
                    >
                      Use Saved Address
                    </button>
                    <button
                      type="button"
                      className={`address-option-btn ${addressOption === 'new' ? 'active' : ''}`}
                      onClick={() => handleAddressOptionChange('new')}
                      aria-label="Add new address"
                    >
                      Add New Address
                    </button>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal Code"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number (10 digits)"
                  required
                  className="form-input"
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    aria-label="Save this address for future orders"
                  />
                  Save this address for future orders
                </label>
              </div>
            </div>

            <div className="payment-section">
              <h3 className="form-section-title">Payment Method</h3>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  value={selectedPaymentMethod}
                  onChange={handlePaymentMethodChange}
                  className="payment-method-select"
                  aria-label="Select payment method"
                >
                  {paymentMethods.length > 0 &&
                    paymentMethods.map((method) => (
                      <option key={method._id} value={method._id}>
                        {method.name} - **** **** **** {method.cardNumber.slice(-4)} (Exp: {method.expiry})
                      </option>
                    ))}
                  <option value="new">Add New Card (Online Payment)</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              {showNewPaymentForm && (
                <>
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="Card Number (16 digits)"
                      required
                      className="form-input"
                      aria-required="true"
                    />
                  </div>
                  <div className="dual-input">
                    <div className="form-group">
                      <label htmlFor="expiry">Expiry</label>
                      <input
                        type="text"
                        id="expiry"
                        name="expiry"
                        value={formData.expiry}
                        onChange={handleInputChange}
                        placeholder="Expiry (MM/YY)"
                        required
                        className="form-input"
                        aria-required="true"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="CVV (3 digits)"
                        required
                        className="form-input"
                        aria-required="true"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="total-and-submit">
            <div className="total-section">
              <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
              {passedDiscount > 0 && (
                <p><strong>Discount ({(passedDiscount * 100).toFixed(0)}%):</strong> -₹{(subtotal * passedDiscount).toFixed(2)}</p>
              )}
              <p><strong>Delivery Fee:</strong> ₹{deliveryFee.toFixed(2)}</p>
              <p><strong>Total:</strong> ₹{total.toFixed(2)}</p>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button
              type="submit"
              className="submit-btn"
              disabled={cart.length === 0 || isSubmitted}
              aria-label="Place your order"
            >
              {isSubmitted ? (
                <span>
                  Processing... <span className="spinner-orbit"></span>
                </span>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </form>
      </div>

      {isSubmitted && <div className="particle-burst"></div>}
    </div>
  );
}

export default Checkout;



























