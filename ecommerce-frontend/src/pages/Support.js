// src/pages/Support.js
import { useState } from 'react';
import '../styles/Support.css';

function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issue: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email';
    if (!formData.issue.trim()) newErrors.issue = 'Issue type is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
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
    const tickets = JSON.parse(localStorage.getItem('supportTickets')) || [];
    tickets.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem('supportTickets', JSON.stringify(tickets));

    setTimeout(() => {
      setSuccess('Your support ticket has been submitted successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', issue: '', description: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="support-container">
      <div className="support-scrollable">
        <div className="support-content">
          <h1 className="support-title">Customer Support</h1>
          <div className="support-card">
            <h2>Submit a Support Ticket</h2>
            {success && <div className="success-message">{success}</div>}
            <form className="support-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="name" className="input-label">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="input-field"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="issue" className="input-label">Issue Type</label>
                <select
                  id="issue"
                  name="issue"
                  className="input-field"
                  value={formData.issue}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an issue</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Other">Other</option>
                </select>
                {errors.issue && <span className="error-text">{errors.issue}</span>}
              </div>
              <div className="input-group">
                <label htmlFor="description" className="input-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="input-field textarea"
                  placeholder="Describe your issue"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
          <div className="support-card">
            <h2>Contact Us Directly</h2>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@cosmiccommerce.com">support@cosmiccommerce.com</a>
            </p>
            <p>
              <strong>Phone:</strong>{' '}
              <a href="tel:+15551234567">+1 (555) 123-4567</a>
            </p>
            <p><strong>Live Chat:</strong> Click below to start a live chat with our support team.</p>
            <button className="chat-btn">Start Live Chat</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;