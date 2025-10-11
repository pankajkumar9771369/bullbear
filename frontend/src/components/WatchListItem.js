import React, { useState } from "react";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
} from "@mui/icons-material";
import "./WatchListItem.css";

const WatchListItem = ({ stock, generalContext }) => {
  const [hover, setHover] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // 'buy' or 'sell'

  // Safe property access with optional chaining
  const change = stock?.change ?? 0;
  const percentChange = stock?.percentChange ?? 0;
  const currentPrice = stock?.currentPrice ?? stock?.price ?? 0;
  const isPositive = change >= 0;

  // Guard clause for undefined stock
  if (!stock) {
    return null;
  }

  const handleBuy = async () => {
    setActionLoading(true);
    setCurrentAction('buy');
    try {
      await generalContext.openBuyWindow(stock.symbol, currentPrice);
    } catch (error) {
      console.error("Error opening buy window:", error);
    } finally {
      setActionLoading(false);
      setCurrentAction(null);
    }
  };

  const handleSell = async () => {
    setActionLoading(true);
    setCurrentAction('sell');
    try {
      await generalContext.openSellWindow(stock.symbol, currentPrice);
    } catch (error) {
      console.error("Error opening sell window:", error);
    } finally {
      setActionLoading(false);
      setCurrentAction(null);
    }
  };

  const handleAnalytics = () => {
    // Add analytics functionality here
    console.log("Analytics for:", stock.symbol);
  };

  const handleMoreActions = () => {
    // Add more actions functionality here
    console.log("More actions for:", stock.symbol);
  };

  // Helper function to get button text
  const getButtonText = (action) => {
    if (actionLoading && currentAction === action) {
      return (
        <>
          <div className="button-spinner"></div>
          {action === 'buy' ? 'Buying...' : 'Selling...'}
        </>
      );
    }
    return action === 'buy' ? 'Buy' : 'Sell';
  };

  return (
    <div 
      className={`watchlist-item-zerodha ${actionLoading ? 'loading' : ''}`}
      onMouseEnter={() => !actionLoading && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="stock-info">
        <div className="stock-name-section">
          <div className="stock-name">{stock.name || "Unknown"}</div>
          <div className="stock-symbol">{stock.symbol || "N/A"}</div>
          {actionLoading && (
            <div className="stock-loading-indicator">
              Processing {currentAction}...
            </div>
          )}
        </div>
        
        <div className="stock-price-section">
          <div className={`stock-price ${isPositive ? 'positive' : 'negative'}`}>
            ₹{currentPrice.toFixed(2)}
          </div>
          <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
          </div>
        </div>
      </div>

      {(hover || actionLoading) && (
        <div className="watchlist-actions">
          <Tooltip title="Buy (B)" placement="top" arrow TransitionComponent={Grow}>
            <button 
              className={`action-btn buy-btn ${actionLoading && currentAction !== 'buy' ? 'disabled' : ''}`}
              onClick={handleBuy}
              disabled={actionLoading && currentAction !== 'buy'}
            >
              {getButtonText('buy')}
            </button>
          </Tooltip>
          
          <Tooltip title="Sell (S)" placement="top" arrow TransitionComponent={Grow}>
            <button 
              className={`action-btn sell-btn ${actionLoading && currentAction !== 'sell' ? 'disabled' : ''}`}
              onClick={handleSell}
              disabled={actionLoading && currentAction !== 'sell'}
            >
              {getButtonText('sell')}
            </button>
          </Tooltip>
          
          <Tooltip title="Analytics (A)" placement="top" arrow TransitionComponent={Grow}>
            <button 
              className="action-btn icon-btn"
              onClick={handleAnalytics}
              disabled={actionLoading}
            >
              <BarChartOutlined className="icon" />
            </button>
          </Tooltip>
          
          <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
            <button 
              className="action-btn icon-btn"
              onClick={handleMoreActions}
              disabled={actionLoading}
            >
              <MoreHoriz className="icon" />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default WatchListItem;