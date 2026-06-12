// src/pages/Terms.js
import '../styles/Terms.css';

function Terms() {
  const handleDownloadPDF = () => {
    // In a real implementation, link to an actual PDF file
    const link = document.createElement('a');
    link.href = '/path/to/terms-and-conditions.pdf'; // Replace with actual path
    link.download = 'CosmicCommerce-TermsAndConditions.pdf';
    link.click();
  };

  return (
    <div className="terms-container">
      <div className="terms-scrollable">
        <div className="terms-content">
          <h1 className="terms-title">Terms & Conditions</h1>
          <div className="terms-card">
            <div className="toc">
              <h2>Table of Contents</h2>
              <ul>
                <li><a href="#introduction">1. Introduction</a></li>
                <li><a href="#use-of-service">2. Use of Service</a></li>
                <li><a href="#account-responsibility">3. Account Responsibility</a></li>
                <li><a href="#payments-and-refunds">4. Payments and Refunds</a></li>
                <li><a href="#shipping">5. Shipping</a></li>
                <li><a href="#limitation-of-liability">6. Limitation of Liability</a></li>
              </ul>
              <button className="download-btn" onClick={handleDownloadPDF}>
                Download PDF
              </button>
            </div>

            <section id="introduction">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Cosmic Commerce. These Terms and Conditions govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms. If you do not agree, please do not use our services.
              </p>
            </section>

            <section id="use-of-service">
              <h2>2. Use of Service</h2>
              <p>
                You agree to use our website only for lawful purposes. You must not use our website to engage in any fraudulent, abusive, or illegal activities. We reserve the right to terminate your access if you violate these terms.
              </p>
            </section>

            <section id="account-responsibility">
              <h2>3. Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account. Cosmic Commerce is not liable for any loss or damage arising from your failure to protect your account.
              </p>
            </section>

            <section id="payments-and-refunds">
              <h2>4. Payments and Refunds</h2>
              <p>
                All payments must be made through the payment methods provided on our website. We offer a 30-day return policy for eligible items. Refunds will be processed within 5-7 business days after approval. See our Returns page for more details.
              </p>
            </section>

            <section id="shipping">
              <h2>5. Shipping</h2>
              <p>
                We ship to over 50 countries. Shipping times and costs vary by location. You are responsible for any customs or import duties that may apply. We are not liable for delays caused by shipping carriers or customs.
              </p>
            </section>

            <section id="limitation-of-liability">
              <h2>6. Limitation of Liability</h2>
              <p>
                Cosmic Commerce is not liable for any indirect, incidental, or consequential damages arising from your use of our website or services. Our total liability to you for any claim will not exceed the amount you paid for the product or service in question.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;