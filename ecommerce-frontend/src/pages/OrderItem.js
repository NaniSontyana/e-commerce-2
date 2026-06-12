import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
  variantDetails,
}) {
  const key = `${order._id}_${item.productId}`;
  const review = reviews ? reviews[key] : null;
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value, 10);
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';
  const isInWishlist = wishlist.some((w) => w.productId?._id?.toString() === item.productId);
  const variantColor = variantDetails?.specifications?.color || 'N/A';

  console.log(`OrderItem rendering for order ID: ${order._id}, navigating to: /order/${order._id}`);
  console.log(`Item details:`, item);

  if (!order._id) {
    console.error('Order ID is missing for item:', item);
    return null;
  }

  return (
    <div className="order-item">
      <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
        <img
          src={variantDetails?.mainImage || item.image || '/default-product.jpg'}
          alt={item.name}
          className="order-item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
        />
      </Link>
      <div className="order-item-details">
        <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="order-item-name">{item.name}</h3>
        </Link>
        <p className="order-item-price">₹{item.price.toFixed(2)}</p>
        {item.size && (
          <p className="variant-info">Size: {item.size}</p>
        )}
        {item.variantId && (
          <p className="variant-info">Color: {variantColor}</p>
        )}
        <p className="order-item-status">
          {order.status} on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="actions-container">
          <div className="wishlist-actions">
            {isInWishlist ? (
              <button
                className="remove-wishlist-btn"
                onClick={() => handleRemoveFromWishlist(item.productId)}
              >
                Remove
              </button>
            ) : (
              <button
                className="add-wishlist-btn"
                onClick={() => handleAddToWishlist(item.productId)}
              >
                Add to Wishlist
              </button>
            )}
            {wishlistMessages[item.productId] && (
              <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
            )}
          </div>
        </div>
        {isDelivered && (
          <div className="review-section">
            {review ? (
              <>
                <div className="review-display">
                  <p>Your Rating: {review.rating} Star{review.rating !== 1 ? 's' : ''}</p>
                  <p>{review.comment}</p>
                </div>
                <button onClick={toggleReviewForm}>Edit Review</button>
                <button onClick={() => handleDeleteReview(order._id, item.productId)}>
                  Delete Review
                </button>
              </>
            ) : (
              <button onClick={toggleReviewForm}>Write a Review</button>
            )}
            {data.showForm && (
              <div className="review-form">
                <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
                <div className="rating">
                  <label htmlFor={`rating-${key}`} className="rating-label">
                    Rating:
                  </label>
                  <select
                    id={`rating-${key}`}
                    value={data.rating}
                    onChange={handleRatingChange}
                    className="rating-dropdown"
                  >
                    <option value="0" disabled>
                      Select a rating
                    </option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <textarea
                  value={data.comment}
                  onChange={handleCommentChange}
                  placeholder="Write your review here..."
                />
                {data.error && <p className="error-message">{data.error}</p>}
                {data.message && <p className="success-message">{data.message}</p>}
                <button
                  onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                  disabled={data.loading}
                >
                  {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </button>
                <button onClick={toggleReviewForm}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItem;

//main
/* import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/OrderItem.css';

function OrderItem({
  order,
  item,
  index,
  reviewData,
  setReviewData,
  reviews,
  handleReviewSubmit,
  handleDeleteReview,
  wishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist,
  wishlistMessages,
  handleReorder,
}) {
  const key = `${order._id}_${item.productId}`;
  const review = reviews ? reviews[key] : null;
  const data = reviewData[key] || { rating: 0, comment: '', message: '', error: '', loading: false, showForm: false };

  const handleRatingChange = (e) => {
    const rating = parseInt(e.target.value, 10);
    setReviewData({ ...reviewData, [key]: { ...data, rating, error: '' } });
  };

  const handleCommentChange = (e) => {
    setReviewData({ ...reviewData, [key]: { ...data, comment: e.target.value, error: '' } });
  };

  const toggleReviewForm = () => {
    setReviewData({ ...reviewData, [key]: { ...data, showForm: !data.showForm } });
  };

  const isDelivered = order.status.toLowerCase() === 'delivered';
  const isInWishlist = wishlist.some((w) => w.productId?._id?.toString() === item.productId);

  return (
    <div className="order-item">
      <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
        <img
          src={item.image || '/default-product.jpg'}
          alt={item.name}
          className="order-item-image"
          onError={(e) => (e.target.src = '/default-product.jpg')}
        />
      </Link>
      <div className="order-item-details">
        <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
          <h3 className="order-item-name">{item.name}</h3>
        </Link>
        <p className="order-item-price">₹{item.price.toFixed(2)}</p>
        <p className="order-item-status">
          {order.status} on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="actions-container">
          {index === 0 && (
            <button className="reorder-btn" onClick={() => handleReorder(order)}>
              Reorder
            </button>
          )}
          <div className="wishlist-actions">
            {isInWishlist ? (
              <button
                className="remove-wishlist-btn"
                onClick={() => handleRemoveFromWishlist(item.productId)}
              >
                Remove 
              </button>
            ) : (
              <button
                className="add-wishlist-btn"
                onClick={() => handleAddToWishlist(item.productId)}
              >
                Add to Wishlist
              </button>
            )}
            {wishlistMessages[item.productId] && (
              <span className="wishlist-message">{wishlistMessages[item.productId]}</span>
            )}
          </div>
        </div>
        {isDelivered && (
          <div className="review-section">
            {review ? (
              <>
                <div className="review-display">
                  <p>Your Rating: {review.rating} Star{review.rating !== 1 ? 's' : ''}</p>
                  <p>{review.comment}</p>
                </div>
                <button onClick={toggleReviewForm}>Edit Review</button>
                <button onClick={() => handleDeleteReview(order._id, item.productId)}>
                  Delete Review
                </button>
              </>
            ) : (
              <button onClick={toggleReviewForm}>Write a Review</button>
            )}
            {data.showForm && (
              <div className="review-form">
                <h4>{review ? 'Edit Review' : 'Write a Review'}</h4>
                <div className="rating">
                  <label htmlFor={`rating-${key}`} className="rating-label">
                    Rating:
                  </label>
                  <select
                    id={`rating-${key}`}
                    value={data.rating}
                    onChange={handleRatingChange}
                    className="rating-dropdown"
                  >
                    <option value="0" disabled>
                      Select a rating
                    </option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <textarea
                  value={data.comment}
                  onChange={handleCommentChange}
                  placeholder="Write your review here..."
                />
                {data.error && <p className="error-message">{data.error}</p>}
                {data.message && <p className="success-message">{data.message}</p>}
                <button
                  onClick={() => handleReviewSubmit(order._id, item.productId, !!review)}
                  disabled={data.loading}
                >
                  {data.loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </button>
                <button onClick={toggleReviewForm}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderItem; */
