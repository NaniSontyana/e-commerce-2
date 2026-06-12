import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext'; // Import ProductContext
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Compare.css';

function Compare() {
  const { products: allProducts, loading: productsLoading } = useProducts(); // Get products from context
  const { search } = useLocation();
  const navigate = useNavigate();
  const [compareProducts, setCompareProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract product IDs from query parameters and fetch products
  useEffect(() => {
    const params = new URLSearchParams(search);
    const productIdsParam = params.get('products');

    if (!productIdsParam) {
      setError('No products selected for comparison.');
      setLoading(false);
      return;
    }

    const productIds = productIdsParam.split(',').filter(id => id);

    if (productIds.length < 2) {
      setError('Please select at least 2 products to compare.');
      setLoading(false);
      return;
    }

    if (productIds.length > 4) {
      setError('You can compare up to 4 products at a time.');
      setLoading(false);
      return;
    }

    // Wait for products to load from context
    if (productsLoading) {
      return; // Keep loading state until products are available
    }

    // Try to find products in the ProductContext
    const foundProducts = [];
    const missingProductIds = [];

    productIds.forEach(id => {
      const product = allProducts.find(p => p._id === id);
      if (product) {
        foundProducts.push(product);
      } else {
        missingProductIds.push(id);
      }
    });

    // If all products are found in context, use them
    if (missingProductIds.length === 0) {
      setCompareProducts(foundProducts);
      setLoading(false);
      return;
    }

    // Fetch missing products from the backend
    const fetchMissingProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const promises = missingProductIds.map(id =>
          axios.get(`https://backend-ps76.onrender.com/api/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const responses = await Promise.all(promises);
        const fetchedProducts = responses.map(res => res.data);
        setCompareProducts([...foundProducts, ...fetchedProducts]);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products for comparison:', err);
        setError('Failed to load some products for comparison.');
        setLoading(false);
        toast.error('Failed to load comparison products.');
      }
    };

    fetchMissingProducts();
  }, [search, allProducts, productsLoading]);

  const handleClearComparison = () => {
    setCompareProducts([]);
    navigate('/products');
    toast.success('Comparison cleared!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const handleBackToProducts = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner"></div>
        <p>Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5 text-center">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn-back" onClick={handleBackToProducts}>
          Back to Products
        </button>
      </div>
    );
  }

  if (compareProducts.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h3>No products selected for comparison</h3>
        <button className="btn-back" onClick={handleBackToProducts}>
          Back to Products
        </button>
      </div>
    );
  }

  // Define the attributes to compare
  const attributes = [
    {
      key: 'image',
      label: 'Image',
      render: (product) => (
        <img
          src={product.image || 'https://via.placeholder.com/100'}
          alt={product.name}
          className="compare-image"
          onError={(e) => (e.target.src = 'https://via.placeholder.com/100')}
        />
      ),
    },
    { key: 'name', label: 'Name', render: (product) => product.name },
    {
      key: 'price',
      label: 'Price',
      render: (product) => `₹${Number(product.price).toFixed(2)}`,
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => {
        const mainCategory = product.mainCategory || 'Uncategorized';
        const subCategory = product.subcategory ? ` > ${product.subcategory}` : '';
        const nestedCategory = product.nestedCategory ? ` > ${product.nestedCategory}` : '';
        return `${mainCategory}${subCategory}${nestedCategory}`;
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product) => (product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
    },
    {
      key: 'offer',
      label: 'Discount',
      render: (product) => (product.offer ? `${product.offer}% off` : 'No Discount'),
    },
    {
      key: 'action',
      label: 'Action',
      render: (product) => (
        <button
          className="btn-view-product"
          onClick={() => navigate(`/product/${product._id}`)}
        >
          View Product
        </button>
      ),
    },
  ];

  return (
    <div className="compare-wrapper">
      <div className="container py-5">
        <div className="compare-header">
          <h1>Compare Products</h1>
          <div className="compare-actions">
            <button className="btn-clear" onClick={handleClearComparison}>
              Clear Comparison
            </button>
            <button className="btn-back" onClick={handleBackToProducts}>
              Back to Products
            </button>
          </div>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key}>
                  <td className="attribute-label">{attr.label}</td>
                  {compareProducts.map((product, index) => (
                    <td key={index} className="attribute-value">
                      {attr.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Compare;
