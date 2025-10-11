// SellPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./SellPage.css";

const SellPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [orderType, setOrderType] = useState("MARKET");
  const [totalAmount, setTotalAmount] = useState(0);

  // Get stock data from navigation or fetch all holdings
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const response = await axios.get("http://localhost:3002/api/holdings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setHoldings(response.data.data);
          
          // If coming from watchlist, pre-select that stock
          if (location.state?.symbol) {
            const preSelected = response.data.data.find(
              holding => holding.symbol === location.state.symbol
            );
            if (preSelected) {
              setSelectedStock(preSelected);
              setSellPrice(location.state.price?.toString() || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching holdings:", error);
        alert("Failed to load your holdings");
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [location]);

  // Calculate total amount when quantity or price changes
  useEffect(() => {
    if (sellQuantity && sellPrice) {
      const quantity = parseInt(sellQuantity);
      const price = parseFloat(sellPrice);
      setTotalAmount(quantity * price);
    } else {
      setTotalAmount(0);
    }
  }, [sellQuantity, sellPrice]);

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setSellQuantity("");
    setSellPrice(stock.price?.toString() || "");
  };

  // Enhanced sell function with funds credit integration
  const executeSellTransaction = async (stock, quantity, price) => {
    const token = localStorage.getItem("userToken");
    const totalSaleAmount = quantity * price;
    
    try {
      // Step 1: Create sell order
      console.log("📦 Creating sell order...");
      const orderResponse = await axios.post(
        "http://localhost:3002/api/orders/create",
        {
          symbol: stock.symbol,
          name: stock.name,
          qty: quantity,
          price: price,
          mode: "SELL",
          orderType: orderType,
          product: "CNC"
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Order creation failed");
      }

      // Step 2: Credit funds to user's account
      console.log("💰 Crediting funds from sale...");
      const fundsResponse = await axios.post(
        "http://localhost:3002/api/funds/add",
        {
          amount: totalSaleAmount,
          paymentIntentId: `sell_${Date.now()}_${stock.symbol}_${Math.random().toString(36).substr(2, 9)}`,
          description: `SELL ${quantity} ${stock.symbol} @ ₹${price}`
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!fundsResponse.data.success) {
        throw new Error(fundsResponse.data.message || "Funds credit failed");
      }

      return {
        success: true,
        orderData: orderResponse.data.data,
        fundsData: fundsResponse.data.data,
        totalAmount: totalSaleAmount
      };

    } catch (error) {
      console.error("❌ Transaction failed:", error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error("Request timeout - please try again");
      } else if (error.response?.status === 401) {
        throw new Error("Session expired - please login again");
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "Invalid request");
      } else if (error.response?.status === 500) {
        throw new Error("Server error - please try again later");
      } else {
        throw new Error(error.response?.data?.message || error.message || "Transaction failed");
      }
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStock) {
      alert("Please select a stock to sell");
      return;
    }

    if (!sellQuantity || sellQuantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (orderType === "LIMIT" && (!sellPrice || sellPrice <= 0)) {
      alert("Please enter a valid price for limit order");
      return;
    }

    const quantity = parseInt(sellQuantity);
    if (quantity > selectedStock.qty) {
      alert(`You only have ${selectedStock.qty} shares of ${selectedStock.symbol}`);
      return;
    }

    const finalPrice = orderType === "MARKET" ? selectedStock.price : parseFloat(sellPrice);

    setProcessing(true);
    try {
      const result = await executeSellTransaction(selectedStock, quantity, finalPrice);
      
      alert(`✅ Sell completed! ₹${result.totalAmount.toLocaleString('en-IN')} credited to your funds`);
      
      // Reset form and navigate to funds page
      setSelectedStock(null);
      setSellQuantity("");
      setSellPrice("");
      
      // Navigate to funds page with success state
      navigate("/jammu/funds", { 
        state: { 
          transactionSuccess: true,
          amount: result.totalAmount,
          message: `Successfully sold ${quantity} ${selectedStock.symbol} shares`
        } 
      });
      
    } catch (error) {
      alert(`❌ Transaction failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="sell-page">
        <div className="loading">Loading your holdings...</div>
      </div>
    );
  }

  return (
    <div className="sell-page">
      <div className="sell-container">
        <div className="sell-header">
          <h1>Sell Shares</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <div className="sell-content">
          {/* Holdings List */}
          <div className="holdings-section">
            <h2>Your Holdings</h2>
            <div className="holdings-list">
              {holdings.length > 0 ? (
                holdings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className={`holding-item ${
                      selectedStock?.symbol === holding.symbol ? "selected" : ""
                    }`}
                    onClick={() => handleStockSelect(holding)}
                  >
                    <div className="holding-info">
                      <div className="holding-symbol">{holding.symbol}</div>
                      <div className="holding-name">{holding.name}</div>
                    </div>
                    <div className="holding-details">
                      <div className="holding-qty">Qty: {holding.qty}</div>
                      <div className="holding-avg">Avg: ₹{holding.avg?.toFixed(2)}</div>
                      <div className="holding-current">LTP: ₹{holding.price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-holdings">
                  <p>You don't have any holdings to sell</p>
                  <button onClick={() => navigate("/")} className="btn-primary">
                    Go to Market
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sell Form */}
          {selectedStock && (
            <div className="sell-form-section">
              <h2>Sell {selectedStock.symbol}</h2>
              
              <form onSubmit={handleSellSubmit} className="sell-form">
                <div className="form-group">
                  <label>Available Quantity: {selectedStock.qty} shares</label>
                  <input
                    type="number"
                    placeholder="Enter quantity to sell"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    min="1"
                    max={selectedStock.qty}
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label>Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    disabled={processing}
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>

                {orderType === "LIMIT" && (
                  <div className="form-group">
                    <label>Price per share (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter price"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      disabled={processing}
                    />
                  </div>
                )}

                {orderType === "MARKET" && (
                  <div className="form-group">
                    <label>Current Market Price</label>
                    <div className="market-price">₹{selectedStock.price?.toFixed(2)}</div>
                  </div>
                )}

                <div className="amount-summary">
                  <div className="amount-row">
                    <span>Total Sale Amount:</span>
                    <span className="amount">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="amount-note">
                    This amount will be credited to your funds immediately
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedStock(null);
                      setSellQuantity("");
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-sell"
                    disabled={processing || !sellQuantity || (orderType === "LIMIT" && !sellPrice)}
                  >
                    {processing ? (
                      <>
                        <div className="processing-spinner"></div>
                        Processing...
                      </>
                    ) : (
                      "Place Sell Order"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellPage;