// src/pages/FAQ.js
import { useState } from 'react';
import '../styles/FAQ.css';

function FAQ() {
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by visiting the 'Order Details' page and entering your order ID. You’ll receive real-time updates on your shipment status.",
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy. Items must be unused and in their original packaging. Visit our Returns page for more details.",
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach us via email at support@cosmiccommerce.com, call us at +1 (555) 123-4567, or use the live chat feature on our website.",
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to over 50 countries. Shipping fees and times vary by location. Check our shipping page for more details.",
    },
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password?'. You’ll receive an email with instructions to reset your password.",
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-scrollable">
        <div className="faq-content">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <div className="faq-card">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {filteredFAQs.length === 0 ? (
              <p>No FAQs found matching your search.</p>
            ) : (
              filteredFAQs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <h3
                    className="faq-question"
                    onClick={() => toggleQuestion(index)}
                  >
                    {faq.question}
                    <span className={`accordion-icon ${openQuestion === index ? 'open' : ''}`}>
                      ▼
                    </span>
                  </h3>
                  {openQuestion === index && (
                    <p className="faq-answer">{faq.answer}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;