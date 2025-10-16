import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Summary.css";
import { jwtDecode } from "jwt-decode";

const Summary = () => {
  const [summary, setSummary] = useState({
    marginAvailable: 0,
    marginUsed: 0,
    holdingsCount: 0,
    pnl: 0,
    pnlPercent: 0,
    totalInvested: 0,
    currentValue: 0,
    investment: 0,
    userName: "Trader",
    openingBalance: 0,
    dayChange: 0,
    dayChangePercent: 0,
    availableCash: 0,
    collateralValue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch summary data from backend using stored token
  const fetchSummaryData = async (token) => {
    try {
      const res = await axios.get("https://alphaedge.onrender.com/api/summary", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("✅ Summary API response:", res.data);

      setSummary((prev) => ({
        ...prev,
        ...res.data,
      }));
    } catch (err) {
      console.error("❌ Error fetching summary:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("userToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
      } else if (err.response?.status === 404) {
        setError("User not found. Please log in again.");
      } else {
        setError("Failed to load portfolio data");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initialize authentication on load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("userToken");
        console.log("🔍 Checking localStorage token:", token ? "Found" : "Missing");

        if (!token) {
          setError("Please log in to access your dashboard");
          setLoading(false);
          return;
        }

        // ✅ Decode token and extract user info
        try {
          const decoded = jwtDecode(token);
          console.log("🔍 Decoded token:", decoded);
          
          // Store user info in localStorage
          localStorage.setItem("userId", decoded.id || decoded.userId || "");
          localStorage.setItem("userName", decoded.username || decoded.name || "GF");
          
          console.log("🔍 User ID from token:", decoded.id || decoded.userId);
          console.log("🔍 User Name from token:", decoded.username || decoded.name);

        } catch (decodeError) {
          console.error("❌ Token decode error:", decodeError);
          setError("Invalid token. Please log in again.");
          localStorage.removeItem("userToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          setLoading(false);
          return;
        }

        // Fetch portfolio/summary data
        await fetchSummaryData(token);

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to initialize dashboard");
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Function to handle token refresh or re-authentication
  const handleReconnect = async () => {
    const token = localStorage.getItem("userToken");
    if (token) {
      setLoading(true);
      setError(null);
      await fetchSummaryData(token);
    } else {
      setError("Please log in again");
    }
  };

  const isProfit = summary.pnl >= 0;
  const isPositive = summary.pnlPercent >= 0;
  const isDayPositive = summary.dayChange >= 0;
  const dayChangePercent = parseFloat(summary.dayChangePercent || 0).toFixed(2);

  if (loading) {
    return (
      <div className="summary-zerodha">
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          Loading portfolio data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-zerodha">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>{error}</h3>
          <p>Please try logging in again</p>
          <button className="retry-button" onClick={handleReconnect}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-zerodha">
      {/* User Welcome Section */}
      <div className="user-welcome">
        <h3 className="welcome-text">Hi, {summary.userName}! 👋</h3>
        <div className="welcome-subtitle">Welcome back to your dashboard</div>
      </div>

      <div className="summary-divider"></div>

      {/* Equity Section */}
      <div className="summary-section">
        <div className="section-header">
          <span className="section-title">Equity</span>
        </div>

        <div className="equity-content">
          <div className="primary-metric">
            <div className="metric-value">
              ₹{parseFloat(summary.marginAvailable || 0).toLocaleString("en-IN")}
            </div>
            <div className="metric-label">Margin available</div>
          </div>

          <div className="secondary-metrics">
            <div className="metric-row">
              <span className="metric-name">Margin used</span>
              <span className="metric-figure">
                ₹{parseFloat(summary.marginUsed || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Opening balance</span>
              <span className="metric-figure">
                ₹{parseFloat(summary.openingBalance || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Available cash</span>
              <span className="metric-figure">
                ₹{parseFloat(summary.availableCash || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-divider"></div>

      {/* Holdings Section */}
      <div className="summary-section">
        <div className="section-header">
          <span className="section-title">Holdings</span>
          <span className="holdings-count">({summary.holdingsCount || 0})</span>
        </div>

        <div className="holdings-content">
          <div className="portfolio-metrics">
            <div className="primary-metric">
              <div className="metric-value">
                ₹{parseFloat(summary.totalInvested || 0).toLocaleString("en-IN")}
              </div>
              <div className="metric-label">Total investment</div>
            </div>

            <div className="pnl-section">
              <div className={`pnl-value ${isProfit ? "positive" : "negative"}`}>
                {isProfit ? "+" : ""}₹
                {parseFloat(summary.pnl || 0).toLocaleString("en-IN")}
                <span className="pnl-percent">
                  ({isPositive ? "+" : ""}
                  {parseFloat(summary.pnlPercent || 0).toFixed(2)}%)
                </span>
              </div>
              <div className="pnl-label">Total P&L</div>
            </div>
          </div>

          <div className="secondary-metrics">
            <div className="metric-row">
              <span className="metric-name">Current value</span>
              <span className="metric-figure">
                ₹{parseFloat(summary.currentValue || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Collateral value</span>
              <span className="metric-figure">
                ₹{parseFloat(summary.collateralValue || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-divider"></div>

      {/* Daily Performance Section */}
      <div className="summary-section">
        <div className="section-header">
          <span className="section-title">Today's Performance</span>
        </div>

        <div className="performance-content">
          <div className="daily-pnl">
            <div className={`daily-value ${isDayPositive ? "positive" : "negative"}`}>
              {isDayPositive ? "+" : ""}₹
              {parseFloat(summary.dayChange || 0).toLocaleString("en-IN")}
              <span className="daily-percent">
                ({isDayPositive ? "+" : ""}
                {dayChangePercent}%)
              </span>
            </div>
            <div className="daily-label">Today's P&L</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{summary.holdingsCount || 0}</div>
          <div className="stat-label">Stocks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ₹{parseFloat(summary.currentValue || 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-label">Portfolio Value</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${isProfit ? "positive" : "negative"}`}>
            {isPositive ? "+" : ""}
            {parseFloat(summary.pnlPercent || 0).toFixed(2)}%
          </div>
          <div className="stat-label">Total Return</div>
        </div>
      </div>
    </div>
  );
};

export default Summary;