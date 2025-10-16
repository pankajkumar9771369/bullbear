import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import StripeCheckout from "./StripeCheckout";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, currentPrice: initialPrice }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [currentPrice, setCurrentPrice] = useState(initialPrice || 0);
  const [loading, setLoading] = useState(!initialPrice);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const generalContext = useContext(GeneralContext);

  // Fetch current price when component mounts
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (initialPrice) {
        setStockPrice(initialPrice);
        return;
      }

      try {
        setLoading(true);
        // Fetch actual current price from your API
        const response = await axios.get(`https://alphaedge.onrender.com/api/stocks/price?symbol=${uid}`);
        const price = response.data.currentPrice || response.data.price || 0;
        setCurrentPrice(price);
        setStockPrice(price);
      } catch (err) {
        console.error("Error fetching current price:", err);
        // Fallback to a reasonable price if API fails
        const fallbackPrice = 100 + (Math.random() * 1000);
        setCurrentPrice(fallbackPrice);
        setStockPrice(fallbackPrice);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentPrice();
  }, [uid, initialPrice]);

  const handleBuyClick = async () => {
    if (stockQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (stockPrice <= 0) {
      alert("Please enter a valid price");
      return;
    }

    // Show Stripe checkout instead of directly placing order
    setShowStripeCheckout(true);
  };

 const handlePaymentSuccess = async (paymentData) => {
  console.log("Payment successful:", paymentData);
  
  try {
    // Get token for authentication
    const token = localStorage.getItem("userToken");
    
    const response = await axios.post("https://alphaedge.onrender.com/api/orders/create", {
      name: uid,
      symbol: uid,
      qty: Number(stockQuantity),
      price: Number(stockPrice),
      mode: "BUY",
      orderType: "MARKET",
      product: "CNC",
      exchange: "NSE",
      paymentIntentId: paymentData.id,
      totalAmount: paymentData.amount / 100
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Order creation response:", response.data);
    
    if (response.data.success) {
      alert("Order placed successfully ✅");
      generalContext.closeBuyWindow();
    } else {
      throw new Error(response.data.message || "Order creation failed");
    }
  } catch (err) {
    console.error("Order creation error details:", err);
    
    if (err.response) {
      console.error("Backend response error:", err.response.data);
      alert(`Order creation failed: ${err.response.data.error || err.response.data.message || 'Unknown error'}`);
    } else if (err.request) {
      console.error("No response received:", err.request);
      alert("No response from server. Please check your connection.");
    } else {
      console.error("Request setup error:", err.message);
      alert(`Payment successful but order recording failed: ${err.message}`);
    }
  }
};

  const handlePaymentClose = () => {
    setShowStripeCheckout(false);
  };

  const handleCancelClick = () => {
    generalContext.closeBuyWindow();
  };

  const totalAmount = (stockPrice * stockQuantity).toFixed(2);
  const amountInPaise = Math.round(stockPrice * stockQuantity * 100); // Convert to paise for Stripe

  // Prepare order data for StripeCheckout
  const orderData = {
    name: uid,
    symbol: uid,
    qty: Number(stockQuantity),
    price: Number(stockPrice),
    mode: "BUY",
    orderType: "MARKET",
    product: "CNC",
    exchange: "NSE"
  };

  if (loading) {
    return (
      <div className="buy-window-overlay">
        <div className="buy-window-zerodha">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            Loading current price...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-window-overlay">
      <div className="buy-window-zerodha">
        <div className="buy-window-header">
          <div className="header-content">
            <h3 className="window-title">Buy {uid}</h3>
            <span className="window-subtitle">Regular order</span>
          </div>
          <button className="close-btn" onClick={handleCancelClick}>
            <span className="close-icon">×</span>
          </button>
        </div>
        
        <div className="buy-window-content">
          <div className="price-info-section">
            <div className="price-info">
              <span className="price-label">Current price</span>
              <span className="price-value">₹{currentPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="input-section">
            <div className="input-group">
              <label htmlFor="qty" className="input-label">Quantity</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  id="qty"
                  className="quantity-input"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="1"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="price" className="input-label">Price (₹)</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  id="price"
                  className="price-input"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                  min="0.05"
                  step="0.05"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="order-summary">
              <div className="summary-row">
                <span className="summary-label">Quantity</span>
                <span className="summary-value">{stockQuantity}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Price</span>
                <span className="summary-value">₹{parseFloat(stockPrice).toFixed(2)}</span>
              </div>
              <div className="summary-row total-row">
                <span className="total-label">Total amount</span>
                <span className="total-value">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="buy-window-footer">
          <div className="margin-info">
            <span className="margin-label">Amount to pay</span>
            <span className="margin-value">₹{totalAmount}</span>
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleCancelClick}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleBuyClick}>
              Pay & Buy
            </button>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      {showStripeCheckout && (
        <StripeCheckout 
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          amount={amountInPaise}
          mode="buy-stocks" 
          orderData={orderData} 
        />
      )}
    </div>
  );
};

export default BuyActionWindow;