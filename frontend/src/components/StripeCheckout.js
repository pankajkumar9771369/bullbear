import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './StripeCheckout.css';

const stripePromise = loadStripe('pk_test_51SG1KJGcwqDSIahjfI4NDhYI0opeJyt7geqIiiPgZiFHQkCKcyqhOWI8m1fosrEMhAyzyVKBbeE1kU45bXfkUgOQ00RK9Np9Hi');

const CheckoutForm = ({ onSuccess, onClose, amount, mode = 'add-funds', orderData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userAmount, setUserAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  // ✅ FIXED: Display amount in rupees (remove /100 division)
  const displayAmount = amount ? amount.toLocaleString('en-IN') : '';

  // Function to create order in your system after successful payment
  const createOrderInSystem = async (paymentIntentId, token) => {
    try {
      if (mode === 'buy-stocks' && orderData) {
        console.log("📦 Creating order in system with data:", orderData);
        
        const orderResponse = await fetch('https://alphaedge.onrender.com/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...orderData,
            paymentIntentId: paymentIntentId
          }),
        });

        const contentType = orderResponse.headers.get('content-type');
        if (!orderResponse.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await orderResponse.json();
            throw new Error(errorData.message || `HTTP error! status: ${orderResponse.status}`);
          } else {
            const text = await orderResponse.text();
            throw new Error(`Server returned ${orderResponse.status} error: ${text.substring(0, 100)}`);
          }
        }

        if (contentType && contentType.includes('application/json')) {
          const orderResult = await orderResponse.json();
          console.log("✅ Order created successfully:", orderResult);
          return orderResult.success;
        } else {
          throw new Error('Server returned non-JSON response');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Order creation error:', error);
      throw error;
    }
  };

  // Function to validate form based on mode
  const validateForm = () => {
    if (mode === 'buy-stocks') {
      if (!amount || amount < 1) { // ✅ Now checking in rupees
        setError('Invalid payment amount');
        return false;
      }
      if (!orderData) {
        setError('Order data is required for stock purchases');
        return false;
      }
    } else {
      const paymentAmount = parseInt(userAmount);
      if (!paymentAmount || paymentAmount < 1) {
        setError('Please enter a valid amount (minimum ₹1)');
        return false;
      }
    }
    return true;
  };

  const getButtonText = () => {
    if (mode === 'buy-stocks') {
      return `Pay ₹${displayAmount}`;
    } else {
      return `Pay ₹${userAmount ? parseInt(userAmount).toLocaleString('en-IN') : '0'}`;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    // Validate form inputs
    if (!validateForm()) {
      return;
    }

    let finalAmountInRupees; // ✅ CHANGED: Now storing rupees

    if (mode === 'buy-stocks') {
      finalAmountInRupees = amount; // ✅ Now in rupees
    } else {
      finalAmountInRupees = parseInt(userAmount); // ✅ Now in rupees
    }

    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      let token = localStorage.getItem("userToken");
      if (!token) {
        setError("Please login to continue");
        setLoading(false);
        return;
      }

      console.log("💰 Sending to backend in RUPEES:", finalAmountInRupees);

      // Create payment intent through backend
      const response = await fetch('https://alphaedge.onrender.com/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: finalAmountInRupees, // ✅ NOW SENDING RUPEES
          currency: 'inr',
          metadata: {
            mode: mode,
            ...(mode === 'buy-stocks' && orderData ? { 
              symbol: orderData.symbol,
              quantity: orderData.qty 
            } : {})
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to create payment');
        setLoading(false);
        return;
      }

      console.log("✅ PaymentIntent created, confirming payment...");

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
      } else if (paymentIntent.status === 'succeeded') {
        console.log("✅ Payment succeeded, creating order...");
        
        try {
          await createOrderInSystem(paymentIntent.id, token);
          
          // Call onSuccess with payment data
          onSuccess({
            amount: paymentIntent.amount / 100, // ✅ Convert back to rupees for frontend
            id: paymentIntent.id,
            status: paymentIntent.status,
            mode: mode
          });
          
        } catch (orderError) {
          console.error("❌ Order creation failed after successful payment:", orderError);
          setError(`Payment successful but failed to record in system: ${orderError.message}`);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  // Handlers for add funds mode
  const handleQuickAmountSelect = (quickAmount) => {
    setUserAmount(quickAmount.toString());
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setUserAmount(value);
    }
    setError(null);
  };

  return (
    <div className="stripe-checkout-overlay">
      <div className="stripe-checkout-modal">
        <div className="modal-header">
          <h3>{mode === 'buy-stocks' ? 'Complete Payment' : 'Add Funds'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {mode === 'buy-stocks' ? (
            <div className="amount-section">
              <div className="selected-amount">
                <h4>Amount to Pay: ₹{displayAmount}</h4>
                <p>This amount is automatically calculated from your order</p>
                {orderData && (
                  <div className="order-details">
                    <small>
                      {orderData.symbol} × {orderData.qty} @ ₹{orderData.price}
                    </small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="amount-section">
              <h4>Select Amount</h4>
              
              <div className="quick-amount-buttons">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <button 
                    key={quickAmount}
                    type="button"
                    className={`quick-amount-btn ${userAmount === quickAmount.toString() ? 'active' : ''}`}
                    onClick={() => handleQuickAmountSelect(quickAmount)}
                  >
                    ₹{quickAmount.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="custom-amount-section">
                <label htmlFor="custom-amount">Or enter custom amount:</label>
                <div className="custom-amount-input">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="custom-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    min="1"
                    max="100000"
                  />
                </div>
                <small className="amount-hint">Minimum ₹1, Maximum ₹1,00,000</small>
              </div>

              {userAmount && (
                <div className="selected-amount">
                  <h4>Amount to Pay: ₹{parseInt(userAmount).toLocaleString('en-IN')}</h4>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-section">
              <label>Card Details</label>
              <div className="card-element-container">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424242',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {error && (
              <div className={`error-message ${error.includes('successful') ? 'warning' : ''}`}>
                {error}
              </div>
            )}

            <div className="action-buttons">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!stripe || loading || 
                  (mode === 'buy-stocks' ? !amount || !orderData : !userAmount)}
              >
                {loading ? 'Processing...' : getButtonText()}
              </button>
            </div>
          </form>

          <div className="security-notice">
            <div className="lock-icon">🔒</div>
            <span>Your payment is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StripeCheckout = ({ onClose, onSuccess, amount, mode = 'add-funds', orderData }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        onSuccess={onSuccess} 
        onClose={onClose} 
        amount={amount}
        mode={mode}
        orderData={orderData}
      />
    </Elements>
  );
};

export default StripeCheckout;