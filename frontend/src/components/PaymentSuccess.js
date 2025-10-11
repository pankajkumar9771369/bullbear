// PaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

 useEffect(() => {
  const fetchSessionData = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const paymentIntentId = urlParams.get("payment_intent");

      if (paymentIntentId) {
        // 🧠 Get token from localStorage
          const token = localStorage.getItem("userToken");
      console.log(token);

        const response = await fetch(
          `http://localhost:3002/api/payment/payment-intent/${paymentIntentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // ✅ Send token here
            },
          }
        );

        const data = await response.json();
        console.log("Fetched session data:", data);
        setSessionData(data);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchSessionData();
}, [location]);


  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading-spinner">Loading payment details...</div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-card">
        {/* Header Section */}
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-subtitle">Thank you for your payment</p>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2 className="section-title">Order Summary</h2>
          
          <div className="summary-grid">
            <div className="summary-row">
              <span className="label">Order ID:</span>
              <span className="value">{sessionData?.id || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Amount Paid:</span>
              <span className="value amount">₹{(sessionData?.amount) || '10.00'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Payment Status:</span>
              <span className="value status success">Completed</span>
            </div>
            <div className="summary-row">
              <span className="label">Payment Method:</span>
              <span className="value">{sessionData?.payment_method_types?.[0] || 'Card'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Date:</span>
              <span className="value">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h2 className="section-title">What happens next?</h2>
          <ul className="steps-list">
            <li>✅ Funds will be added to your account instantly</li>
            <li>📧 You will receive a payment confirmation email</li>
            <li>💳 The amount will reflect in your available balance</li>
            <li>🔒 Your payment was processed securely by Stripe</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link to="/jammu/funds" className="btn btn-primary">
            Back to Funds
          </Link>
          <Link to="/jammu" className="btn btn-secondary">
            Go to Dashboard
          </Link>
        </div>

        {/* Security Badge */}
        <div className="security-badge">
          <div className="lock-icon">🔒</div>
          <span className="security-text">Payment processed securely by Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

