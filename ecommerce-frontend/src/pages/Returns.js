// src/pages/Returns.js
import { useState } from 'react';
import '../styles/Returns.css';

function Returns() {
  const [formData, setFormData] = useState({
    orderId: '',
    reason: '',
    details: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.orderId.trim()) newErrors.orderId = 'Order ID is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason for return is required';
    if (!formData.details.trim()) newErrors.details = 'Details are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Simulate API call by saving to localStorage (replace with actual backend API)
    const returns = JSON.parse(localStorage.getItem('returnRequests')) || [];
    returns.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem('returnRequests', JSON.stringify(returns));

    setTimeout(() => {
      setSuccess('Your return request has been submitted successfully! We will contact you soon.');
      setFormData({ orderId: '', reason: '', details: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="returns-container">
      <div className="returns-scrollable">
        <div className="returns-content">
          <h1 className="returns-title">Returns & Refunds</h1>
          <div className="returns-card">
            <h2>Return Policy</h2>
            <p>
              We offer a 30-day return policy for unused items in their original packaging. To initiate a return, please fill out the form below. Returns are subject to approval, and shipping costs may apply.
            </p>
            <ul>
              <li>Items must be returned within 30 days of delivery.</li>
              <li>Items must be unused and in their original packaging.</li>
              <li>Customized items are non-returnable.</li>
              <li>Refunds will be processed within 5-7 business days after approval.</li>
            </ul>
          </div>
          <div className="returns-card">
            <h2>Request a Return</h2>
            {success && <div className="success-message">{success}</div>}
            <form className="returns-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="orderId" className="input-label">Order ID</label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  className="input-field"
                  placeholder="Enter your order ID"
                  value={formData.orderId}
                  onChange={handleChange}
                  required
                />
                {errors.orderId && <span className="error-text">{errors.orderId}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="reason" className="input-label">Reason for Return</label>
                <select
                  id="reason"
                  name="reason"
                  className="input-field"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Defective Item">Defective Item</option>
                  <option value="Wrong Item">Wrong Item</option>
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reason && <span className="error-text">{errors.reason}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="details" className="input-label">Details</label>
                <textarea
                  id="details"
                  name="details"
                  className="input-field textarea"
                  placeholder="Provide more details about your return"
                  value={formData.details}
                  onChange={handleChange}
                  required
                />
                {errors.details && <span className="error-text">{errors.details}</span>}
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Returns;