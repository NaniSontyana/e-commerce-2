 import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Failure.css'; // Create this CSS file

function Failure() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/checkout');
  };

  const handleReturn = () => {
    navigate('/products');
  };

  return (
    <div className="failure-wrapper">
      <div className="failure-container">
        <h1 className="failure-title">Order Failed</h1>
        <p className="failure-message">
          Oops! Something went wrong with your payment, or it was canceled. Please try again or contact support if the issue persists.
        </p>
        <div className="button-group">
          <button className="retry-btn" onClick={handleRetry}>
            Retry Checkout
          </button>
          <button className="return-btn" onClick={handleReturn}>
            Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}



export default Failure; 








