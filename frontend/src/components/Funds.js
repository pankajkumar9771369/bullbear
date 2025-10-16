import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Funds.css";
import StripeCheckout from "./StripeCheckout";

const Funds = () => {
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [fundsData, setFundsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const navigate = useNavigate();

  // Fetch user funds
  useEffect(() => {
    fetchUserFunds();
  }, []);

  const fetchUserFunds = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`https://alphaedge.onrender.com/api/funds/my-funds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch funds');
      }
      
      const data = await response.json();
      if (data.success) {
        setFundsData(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
      setFundsData({
        totalFunds: 0,
        availableBalance: 0,
        investedAmount: 0,
        fundsHistory: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = () => {
    setShowStripeCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowStripeCheckout(false);
  };

  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawAmount("");
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('https://alphaedge.onrender.com/api/funds/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          description: 'Funds withdrawal'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert("Withdrawal successful!");
        handleCloseWithdrawModal();
        fetchUserFunds(); // Refresh funds data
      } else {
        alert(result.message || "Withdrawal failed");
      }
    } catch (err) {
      console.error("Error withdrawing funds:", err);
      alert("Withdrawal failed. Please try again.");
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('https://alphaedge.onrender.com/api/funds/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: paymentData.amount,
          paymentIntentId: paymentData.id,
          description: 'Funds added via Stripe'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        fetchUserFunds(); // Refresh funds data
        setShowStripeCheckout(false);
        navigate(`/jammu/payment-success?payment_intent=${paymentData.id}&type=add_funds`);
      } else {
        alert(result.message || "Failed to add funds");
      }
    } catch (err) {
      console.error("Error recording funds:", err);
      alert("Payment successful but failed to update funds");
    }
  };

  if (loading) {
    return (
      <div className="funds-zerodha">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading funds data...
        </div>
      </div>
    );
  }

  return (
    <div className="funds-zerodha">
      <div className="funds-header">
        <div className="header-content">
          <h2>Funds</h2>
          <p className="header-subtitle">
            Total Balance: ₹{(fundsData?.totalFunds || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-green" onClick={handleAddFunds}>
            Add funds
          </button>
        
        </div>
      </div>

      <div className="funds-divider"></div>

      <div className="funds-content">
        <div className="funds-columns">
          <div className="funds-column">
            <div className="column-header">
              <h3 className="section-title">Balance Summary</h3>
            </div>
            
            <div className="funds-table">
              <div className="table-section">
                <div className="table-row highlight">
                  <span className="label">Total Balance</span>
                  <span className="value colored">₹{(fundsData?.totalFunds || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="table-row">
                  <span className="label">Available Balance</span>
                  <span className="value positive">₹{(fundsData?.availableBalance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="table-row">
                  <span className="label">Invested Amount</span>
                  <span className="value">₹{(fundsData?.investedAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="table-row">
                  <span className="label">Used Margin</span>
                  <span className="value">₹0.00</span>
                </div>
              </div>

              <div className="table-divider"></div>

              <div className="table-section">
                <h4 className="subsection-title">Recent Transactions</h4>
                {fundsData?.fundsHistory?.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="table-row">
                    <div className="transaction-info">
                      <span className="transaction-description">{transaction.description}</span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`value ${transaction.type === 'add' ? 'positive' : transaction.type === 'withdraw' ? 'negative' : 'investment'}`}>
                      {transaction.type === 'add' ? '+' : transaction.type === 'withdraw' ? '-' : '⏣'}
                      ₹{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {(!fundsData?.fundsHistory || fundsData.fundsHistory.length === 0) && (
                  <div className="table-row">
                    <span className="label">No transactions yet</span>
                    <span className="value">-</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="funds-column">
            <div className="column-header">
              <h3 className="section-title">Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <div className="action-card" onClick={handleAddFunds}>
                <div className="action-icon">💳</div>
                <div className="action-content">
                  <h4>Add Funds</h4>
                  <p>Instant deposit via UPI, Net Banking</p>
                </div>
              </div>
              <div className="action-card" onClick={handleWithdrawClick}>
                <div className="action-icon">🏦</div>
                <div className="action-content">
                  <h4>Withdraw Funds</h4>
                  <p>Transfer to your bank account</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Withdraw Funds</h3>
              <button className="modal-close" onClick={handleCloseWithdrawModal}>×</button>
            </div>
            <form onSubmit={handleWithdrawSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Amount to Withdraw (₹)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    max={fundsData?.availableBalance || 0}
                    step="0.01"
                    required
                  />
                  <div className="balance-info">
                    Available: ₹{(fundsData?.availableBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseWithdrawModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-green">
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStripeCheckout && (
        <StripeCheckout 
          onClose={handleCloseCheckout}
          onSuccess={handlePaymentSuccess}
          mode="add-funds"
        />
      )}
    </div>
  );
};

export default Funds;