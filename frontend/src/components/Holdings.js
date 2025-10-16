import React, { useState, useEffect } from "react";
import { VerticalGraph } from "./VerticalGraph";
import "./Holdings.css";
const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        
        const response = await fetch('https://alphaedge.onrender.com/api/holdings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch holdings: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setAllHoldings(result.data || []);
        } else {
          throw new Error(result.message || 'Failed to fetch holdings');
        }
      } catch (error) {
        console.error("Error fetching holdings:", error);
        setError(error.message);
        setAllHoldings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="holdings-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your holdings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="holdings-container">
        <div className="error-state">
          <h3>Unable to load holdings</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (allHoldings.length === 0) {
    return (
      <div className="holdings-container">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No holdings yet</h3>
          <p>Your investment portfolio will appear here once you start trading</p>
        </div>
      </div>
    );
  }

  const labels = allHoldings.map((stock) => stock.name);

  const data = {
    labels,
    datasets: [
      {
        label: "Current Value",
        data: allHoldings.map((stock) => parseFloat(stock.currentValue) || 0),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
    ],
  };

  // Calculate portfolio summary
  const summary = allHoldings.reduce(
    (acc, holding) => {
      acc.totalInvestment += parseFloat(holding.investment);
      acc.currentValue += parseFloat(holding.currentValue);
      acc.totalPnl += parseFloat(holding.pnl);
      acc.dayPnl += parseFloat(holding.dayPnl);
      return acc;
    },
    { totalInvestment: 0, currentValue: 0, totalPnl: 0, dayPnl: 0 }
  );

  summary.totalPnlPercentage = summary.totalInvestment > 0 
    ? (summary.totalPnl / summary.totalInvestment) * 100 
    : 0;

  return (
    <div className="holdings-container">
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <span className="summary-label">Total Investment</span>
          <span className="summary-value">₹{summary.totalInvestment.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Current Value</span>
          <span className="summary-value">₹{summary.currentValue.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total P&L</span>
          <span className={`summary-value ${summary.totalPnl >= 0 ? 'profit' : 'loss'}`}>
            ₹{Math.abs(summary.totalPnl).toFixed(2)} ({summary.totalPnlPercentage.toFixed(2)}%)
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Day P&L</span>
          <span className={`summary-value ${summary.dayPnl >= 0 ? 'profit' : 'loss'}`}>
            ₹{Math.abs(summary.dayPnl).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>P&L %</th>
              <th>Day P&L</th>
            </tr>
          </thead>
          <tbody>
            {allHoldings.map((stock, index) => {
              const isProfit = parseFloat(stock.pnl) >= 0;
              const profClass = isProfit ? "profit" : "loss";
              
              return (
                <tr key={stock.id || index}>
                  <td className="instrument-cell">
                    <div className="stock-name">{stock.name}</div>
                    <div className="stock-symbol">{stock.symbol}</div>
                  </td>
                  <td>{stock.quantity}</td>
                  <td>₹{parseFloat(stock.averagePrice).toFixed(2)}</td>
                  <td>₹{parseFloat(stock.livePrice).toFixed(2)}</td>
                  <td>₹{parseFloat(stock.currentValue).toFixed(2)}</td>
                  <td className={profClass}>
                    {parseFloat(stock.pnl) >= 0 ? '+' : ''}₹{Math.abs(parseFloat(stock.pnl)).toFixed(2)}
                  </td>
                  <td className={profClass}>
                    {parseFloat(stock.pnlPercentage) >= 0 ? '+' : ''}{parseFloat(stock.pnlPercentage).toFixed(2)}%
                  </td>
                  <td className={profClass}>
                    {parseFloat(stock.dayPnl) >= 0 ? '+' : ''}₹{Math.abs(parseFloat(stock.dayPnl)).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Portfolio Chart */}
      <VerticalGraph data={data} />
    </div>
  );
};

export default Holdings;