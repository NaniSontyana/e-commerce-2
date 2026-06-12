import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, logout } = useAuth();
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart([]);
        return;
      }

      const res = await axios.get('https://backend-ps76.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Fetched cart response:', res.data);

      const cartItems = res.data.cart?.items || [];
      // Process cart items with image, variant, and size handling
      const processedCartItems = cartItems.map((item) => {
        // Find the variant details if variantId exists
        let selectedVariant = null;
        if (item.variantId && item.productId?.variants) {
          selectedVariant = item.productId.variants.find((v) => v.variantId === item.variantId) || null;
        }

        return {
          ...item,
          productId: {
            ...item.productId,
            image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
              ? item.productId.image
              : 'https://placehold.co/50?text=No+Image',
            images: item.productId?.images && Array.isArray(item.productId.images)
              ? item.productId.images.map((img) =>
                  typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                    ? img
                    : 'https://placehold.co/50?text=No+Image'
                )
              : [],
            variants: item.productId?.variants && Array.isArray(item.productId.variants)
              ? item.productId.variants.map((variant) => ({
                  variantId: variant.variantId || '',
                  mainImage: variant.mainImage && typeof variant.mainImage === 'string' && (variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://'))
                    ? variant.mainImage
                    : 'https://placehold.co/50?text=No+Image',
                  additionalImages: variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                          ? img
                          : 'https://placehold.co/50?text=No+Image'
                      )
                    : [],
                  specifications: variant.specifications || {},
                }))
              : [],
            sizes: item.productId?.sizes && Array.isArray(item.productId.sizes) ? item.productId.sizes : [],
          },
          selectedVariant, // Add selected variant details for display
        };
      });
      setCart(processedCartItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCart([]);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error('Failed to load cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const addToCart = async (product, size = null, variantId = null, isBulk = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to add items to your cart.');
      }

      let res;
      if (isBulk) {
        console.log('Adding bulk items to cart:', product);
        const items = product.map((item) => ({
          productId: item.productId || item._id,
          quantity: item.quantity || 1,
          size: item.size || null,
          variantId: item.variantId || null,
        }));
        console.log('Bulk items to add:', items);

        for (const item of items) {
          res = await axios.post(
            'https://backend-ps76.onrender.com/api/cart/add',
            { productId: item.productId, quantity: item.quantity, size: item.size, variantId: item.variantId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } else {
        console.log('Adding single item to cart:', product, 'Size:', size, 'VariantId:', variantId);
        const payload = { productId: product._id, quantity: 1, size, variantId };
        res = await axios.post('https://backend-ps76.onrender.com/api/cart/add', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Add to cart response:', res.data);
      }

      const cartItems = res.data.cart?.items || [];
      // Process cart items with image, variant, and size handling
      const processedCartItems = cartItems.map((item) => {
        // Find the variant details if variantId exists
        let selectedVariant = null;
        if (item.variantId && item.productId?.variants) {
          selectedVariant = item.productId.variants.find((v) => v.variantId === item.variantId) || null;
        }

        return {
          ...item,
          productId: {
            ...item.productId,
            image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
              ? item.productId.image
              : 'https://placehold.co/50?text=No+Image',
            images: item.productId?.images && Array.isArray(item.productId.images)
              ? item.productId.images.map((img) =>
                  typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                    ? img
                    : 'https://placehold.co/50?text=No+Image'
                )
              : [],
            variants: item.productId?.variants && Array.isArray(item.productId.variants)
              ? item.productId.variants.map((variant) => ({
                  variantId: variant.variantId || '',
                  mainImage: variant.mainImage && typeof variant.mainImage === 'string' && (variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://'))
                    ? variant.mainImage
                    : 'https://placehold.co/50?text=No+Image',
                  additionalImages: variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                          ? img
                          : 'https://placehold.co/50?text=No+Image'
                      )
                    : [],
                  specifications: variant.specifications || {},
                }))
              : [],
            sizes: item.productId?.sizes && Array.isArray(item.productId.sizes) ? item.productId.sizes : [],
          },
          selectedVariant, // Add selected variant details for display
        };
      });
      setCart(processedCartItems);

      toast.success(isBulk ? 'Items added to cart!' : `${product.name} added to cart!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else if (err.response?.status === 404 && !err.response?.data?.message) {
        toast.error('Cart endpoint not found. Please check the backend setup.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to add to cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to remove items from your cart.');
      }

      console.log('Removing item with ID:', itemId);
      const res = await axios.delete(`https://backend-ps76.onrender.com/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cartItems = res.data.cart?.items || [];
      // Process cart items with image, variant, and size handling
      const processedCartItems = cartItems.map((item) => {
        // Find the variant details if variantId exists
        let selectedVariant = null;
        if (item.variantId && item.productId?.variants) {
          selectedVariant = item.productId.variants.find((v) => v.variantId === item.variantId) || null;
        }

        return {
          ...item,
          productId: {
            ...item.productId,
            image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
              ? item.productId.image
              : 'https://placehold.co/50?text=No+Image',
            images: item.productId?.images && Array.isArray(item.productId.images)
              ? item.productId.images.map((img) =>
                  typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                    ? img
                    : 'https://placehold.co/50?text=No+Image'
                )
              : [],
            variants: item.productId?.variants && Array.isArray(item.productId.variants)
              ? item.productId.variants.map((variant) => ({
                  variantId: variant.variantId || '',
                  mainImage: variant.mainImage && typeof variant.mainImage === 'string' && (variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://'))
                    ? variant.mainImage
                    : 'https://placehold.co/50?text=No+Image',
                  additionalImages: variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                          ? img
                          : 'https://placehold.co/50?text=No+Image'
                      )
                    : [],
                  specifications: variant.specifications || {},
                }))
              : [],
            sizes: item.productId?.sizes && Array.isArray(item.productId.sizes) ? item.productId.sizes : [],
          },
          selectedVariant, // Add selected variant details for display
        };
      });
      setCart(processedCartItems);

      toast.info('Item removed from cart!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to remove item.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to update your cart.');
      }

      console.log('Updating quantity for item ID:', itemId, 'to:', quantity);
      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/cart/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cartItems = res.data.cart?.items || [];
      // Process cart items with image, variant, and size handling
      const processedCartItems = cartItems.map((item) => {
        // Find the variant details if variantId exists
        let selectedVariant = null;
        if (item.variantId && item.productId?.variants) {
          selectedVariant = item.productId.variants.find((v) => v.variantId === item.variantId) || null;
        }

        return {
          ...item,
          productId: {
            ...item.productId,
            image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
              ? item.productId.image
              : 'https://placehold.co/50?text=No+Image',
            images: item.productId?.images && Array.isArray(item.productId.images)
              ? item.productId.images.map((img) =>
                  typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                    ? img
                    : 'https://placehold.co/50?text=No+Image'
                )
              : [],
            variants: item.productId?.variants && Array.isArray(item.productId.variants)
              ? item.productId.variants.map((variant) => ({
                  variantId: variant.variantId || '',
                  mainImage: variant.mainImage && typeof variant.mainImage === 'string' && (variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://'))
                    ? variant.mainImage
                    : 'https://placehold.co/50?text=No+Image',
                  additionalImages: variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
                          ? img
                          : 'https://placehold.co/50?text=No+Image'
                      )
                    : [],
                  specifications: variant.specifications || {},
                }))
              : [],
            sizes: item.productId?.sizes && Array.isArray(item.productId.sizes) ? item.productId.sizes : [],
          },
          selectedVariant, // Add selected variant details for display
        };
      });
      setCart(processedCartItems);

      toast.success('Quantity updated!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error updating quantity:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to update quantity.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart([]);
        setCoupon(null);
        toast.info('Cart cleared!', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      const res = await axios.delete('https://backend-ps76.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart?.items || []);
      setCoupon(null);
      toast.info('Cart cleared!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to clear cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const applyCoupon = (couponCode) => {
    const validCoupons = {
      SAVE10: 10,
      SAVE20: 20,
    };

    const discount = validCoupons[couponCode];
    if (discount) {
      setCoupon({ code: couponCode, discount });
      toast.success(`Coupon "${couponCode}" applied! ${discount}% off`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } else {
      setCoupon(null);
      toast.error('Invalid coupon code!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const calculateSubtotal = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + Number(item.productId?.price || 0) * (item.quantity || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (coupon) {
      const discountAmount = subtotal * (coupon.discount / 100);
      return subtotal - discountAmount;
    }
    return subtotal;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        coupon,
        calculateSubtotal,
        calculateTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);



///main
/* import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, logout } = useAuth();
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart([]);
        return;
      }

      const res = await axios.get('https://backend-ps76.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Fetched cart response:', res.data);

      const cartItems = res.data.cart?.items || [];
      // Use image directly if it's a valid URL, otherwise use placeholder
      const processedCartItems = cartItems.map(item => ({
        ...item,
        productId: {
          ...item.productId,
          image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
            ? item.productId.image
            : 'https://placehold.co/50?text=No+Image',
        },
      }));
      setCart(processedCartItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCart([]);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error('Failed to load cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const addToCart = async (product, isBulk = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to add items to your cart.');
      }

      let res;
      if (isBulk) {
        console.log('Adding bulk items to cart:', product);
        const items = product.map((item) => ({
          productId: item.productId || item._id,
          quantity: item.quantity || 1,
        }));
        console.log('Bulk items to add:', items);

        for (const item of items) {
          res = await axios.post(
            'https://backend-ps76.onrender.com/api/cart/add',
            { productId: item.productId, quantity: item.quantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } else {
        console.log('Adding single item to cart:', product);
        const payload = { productId: product._id, quantity: 1 };
        res = await axios.post('https://backend-ps76.onrender.com/api/cart/add', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Add to cart response:', res.data);
      }

      const cartItems = res.data.cart?.items || [];
      // Use image directly if it's a valid URL, otherwise use placeholder
      const processedCartItems = cartItems.map(item => ({
        ...item,
        productId: {
          ...item.productId,
          image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
            ? item.productId.image
            : 'https://placehold.co/50?text=No+Image',
        },
      }));
      setCart(processedCartItems);

      toast.success(isBulk ? 'Items added to cart!' : `${product.name} added to cart!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else if (err.response?.status === 404 && !err.response?.data?.message) {
        toast.error('Cart endpoint not found. Please check the backend setup.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to add to cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to remove items from your cart.');
      }

      console.log('Removing item with ID:', itemId);
      const res = await axios.delete(`https://backend-ps76.onrender.com/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cartItems = res.data.cart?.items || [];
      // Use image directly if it's a valid URL, otherwise use placeholder
      const processedCartItems = cartItems.map(item => ({
        ...item,
        productId: {
          ...item.productId,
          image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
            ? item.productId.image
            : 'https://placehold.co/50?text=No+Image',
        },
      }));
      setCart(processedCartItems);

      toast.info('Item removed from cart!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error removing from cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to remove item.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to update your cart.');
      }

      console.log('Updating quantity for item ID:', itemId, 'to:', quantity);
      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/cart/${itemId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cartItems = res.data.cart?.items || [];
      // Use image directly if it's a valid URL, otherwise use placeholder
      const processedCartItems = cartItems.map(item => ({
        ...item,
        productId: {
          ...item.productId,
          image: item.productId?.image && typeof item.productId.image === 'string' && (item.productId.image.startsWith('http://') || item.productId.image.startsWith('https://'))
            ? item.productId.image
            : 'https://placehold.co/50?text=No+Image',
        },
      }));
      setCart(processedCartItems);

      toast.success('Quantity updated!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error updating quantity:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to update quantity.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart([]);
        setCoupon(null);
        toast.info('Cart cleared!', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      const res = await axios.delete('https://backend-ps76.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart?.items || []);
      setCoupon(null);
      toast.info('Cart cleared!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to clear cart.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const applyCoupon = (couponCode) => {
    const validCoupons = {
      SAVE10: 10,
      SAVE20: 20,
    };

    const discount = validCoupons[couponCode];
    if (discount) {
      setCoupon({ code: couponCode, discount });
      toast.success(`Coupon "${couponCode}" applied! ${discount}% off`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } else {
      setCoupon(null);
      toast.error('Invalid coupon code!', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const calculateSubtotal = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + Number(item.productId?.price || 0) * (item.quantity || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (coupon) {
      const discountAmount = subtotal * (coupon.discount / 100);
      return subtotal - discountAmount;
    }
    return subtotal;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        coupon,
        calculateSubtotal,
        calculateTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
 */
