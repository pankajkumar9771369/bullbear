import React, { useEffect, useState } from "react";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalInvestment: 0,
    totalCurrentValue: 0,
    totalPnl: 0,
    totalPnlPercentage: 0,
    totalDayPnl: 0
  });

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        
        const response = await fetch('http://localhost:3002/api/positions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch positions: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setPositions(result.data || []);
          setSummary(result.summary || {
            totalInvestment: 0,
            totalCurrentValue: 0,
            totalPnl: 0,
            totalPnlPercentage: 0,
            totalDayPnl: 0
          });
        } else {
          throw new Error(result.message || 'Failed to fetch positions');
        }
      } catch (error) {
        console.error("Error loading positions:", error);
        setError(error.message);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  const handleSquareOff = async (symbol) => {
    if (!window.confirm(`Are you sure you want to square off ${symbol}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:3002/api/positions/square-off', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ symbol })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Position squared off successfully! P&L: ₹${result.data.pnl}`);
        // Refresh positions
        window.location.reload();
      } else {
        alert(result.message || 'Failed to square off position');
      }
    } catch (error) {
      console.error("Error squaring off position:", error);
      alert('Failed to square off position');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="positions-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your positions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="positions-container">
        <div className="error-state">
          <h3>Unable to load positions</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (positions.length === 0) {
    return (
      <div className="positions-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No open positions</h3>
          <p>Your active positions will appear here once you start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="positions-container">
      <h3 className="title">Positions ({positions.length})</h3>

      {/* Positions Summary */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <span className="summary-label">Total Investment</span>
          <span className="summary-value">₹{summary.totalInvestment.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Current Value</span>
          <span className="summary-value">₹{summary.totalCurrentValue.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total P&L</span>
          <span className={`summary-value ${summary.totalPnl >= 0 ? 'profit' : 'loss'}`}>
            ₹{Math.abs(summary.totalPnl).toFixed(2)} ({summary.totalPnlPercentage.toFixed(2)}%)
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Day P&L</span>
          <span className={`summary-value ${summary.totalDayPnl >= 0 ? 'profit' : 'loss'}`}>
            ₹{Math.abs(summary.totalDayPnl).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Positions Table */}
      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>P&L %</th>
              <th>Day P&L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position, index) => {
              const isProfit = parseFloat(position.pnl) >= 0;
              const profClass = isProfit ? "profit" : "loss";
              const dayProfit = parseFloat(position.dayPnl) >= 0;
              const dayClass = dayProfit ? "profit" : "loss";

              return (
                <tr key={position.id || index}>
                  <td className="product-cell">
                    <span className="product-badge">{position.product}</span>
                  </td>
                  <td className="instrument-cell">
                    <div className="stock-name">{position.name}</div>
                    <div className="stock-symbol">{position.symbol}</div>
                    <div className="stock-exchange">{position.exchange}</div>
                  </td>
                  <td className="quantity-cell">{position.quantity}</td>
                  <td className="price-cell">₹{parseFloat(position.averagePrice).toFixed(2)}</td>
                  <td className="price-cell">₹{parseFloat(position.livePrice).toFixed(2)}</td>
                  <td className={profClass}>
                    {parseFloat(position.pnl) >= 0 ? '+' : ''}₹{Math.abs(parseFloat(position.pnl)).toFixed(2)}
                  </td>
                  <td className={profClass}>
                    {parseFloat(position.pnlPercentage) >= 0 ? '+' : ''}{parseFloat(position.pnlPercentage).toFixed(2)}%
                  </td>
                  <td className={dayClass}>
                    {parseFloat(position.dayPnl) >= 0 ? '+' : ''}₹{Math.abs(parseFloat(position.dayPnl)).toFixed(2)}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="btn-square-off"
                      onClick={() => handleSquareOff(position.symbol)}
                      title="Square Off Position"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Additional Info */}
      <div className="positions-info">
        <p className="info-text">
          <strong>Note:</strong> Positions are updated in real-time. Click "Close" to square off any position.
        </p>
      </div>
    </div>
  );
};

export default Positions;