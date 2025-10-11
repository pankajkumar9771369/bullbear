import React, { useState } from "react";
import axios from "axios";
import { Tooltip, Grow } from "@mui/material";
import { Add } from "@mui/icons-material";
import "./WatchListSearch.css";

const WatchListSearch = ({ watchlist, setWatchlist }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    
    if (term.length > 2) {
      setIsSearching(true);
      try {
        console.log("🔍 Searching for:", term);
        const response = await axios.get(
          `http://localhost:3002/api/stocks/search?q=${term}`
        );
        console.log("📊 Search results:", response.data);
        setSearchResults(response.data || []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Helper function to get stock properties in either format
  const getStockProperty = (stock, prop) => {
    // Handle both formats: numbered properties and simplified properties
    if (stock[`1. symbol`] !== undefined) {
      // Numbered format (old)
      switch(prop) {
        case 'symbol': return stock['1. symbol'];
        case 'name': return stock['2. name'];
        case 'region': return stock['4. region'];
        case 'currency': return stock['8. currency'];
        default: return stock[prop];
      }
    } else {
      // Simplified format (new)
      return stock[prop];
    }
  };

  const addToWatchlist = async (stock) => {
  if (watchlist.length >= 50) {
    alert("Watchlist limit reached. Maximum 50 stocks allowed.");
    return;
  }

  const symbol = stock['1. symbol'] || stock.symbol;
  const name = stock['2. name'] || stock.name;

  if (watchlist.some(item => item.symbol === symbol)) {
    alert(`${symbol} is already in your watchlist`);
    return;
  }

  try {
    // ✅ FIX: Use the correct endpoint /api/watchlist/add
    const response = await axios.post("http://localhost:3002/api/watchlist/add", {
      name: name,
      symbol: symbol,
      fallbackPrice: 0
    });

    console.log("✅ Stock added successfully:", response.data);
    
    // Refresh the watchlist after successful addition
    const res = await axios.get("http://localhost:3002/api/watchlist");
    setWatchlist(res.data);
    setSearchTerm("");
    setSearchResults([]);
    
  } catch (err) {
    console.error("❌ Error adding to watchlist:", err);
    
    // Enhanced error logging
    if (err.response) {
      console.error("Server response:", err.response.status, err.response.data);
      alert(`Failed to add stock: ${err.response.data.message || 'Server error'}`);
    } else if (err.request) {
      console.error("No response received:", err.request);
      alert("Failed to connect to server. Please try again.");
    } else {
      console.error("Error:", err.message);
      alert("Failed to add stock to watchlist");
    }
  }
};
const clearSearch = () => {
  setSearchTerm("");
  setSearchResults([]);
};
  return (
    <div className="search-container-zerodha">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search stocks (e.g., INFY, RELIANCE, AAPL)"
          className="search-input-zerodha"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={clearSearch}>
            ✕
          </button>
        )}
        <span className="stock-count">{watchlist.length}/50</span>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results-zerodha">
          {searchResults.slice(0, 8).map((stock, index) => {
            const symbol = getStockProperty(stock, 'symbol');
            const name = getStockProperty(stock, 'name');
            const region = getStockProperty(stock, 'region');
            
            return (
              <div 
                key={`${symbol}-${index}`} 
                className="search-result-item-zerodha"
              >
                <div className="result-info">
                  <div className="result-symbol">{symbol}</div>
                  <div className="result-name">{name}</div>
                  <div className="result-type">{region}</div>
                </div>
                
                <Tooltip title="Add to Watchlist" placement="top" arrow TransitionComponent={Grow}>
                  <button 
                    className="add-to-watchlist-btn"
                    onClick={() => addToWatchlist(stock)}
                  >
                    <Add className="add-icon" />
                  </button>
                </Tooltip>
              </div>
            );
          })}
        </div>
      )}

      {isSearching && searchTerm.length > 2 && (
        <div className="search-results-zerodha">
          <div className="search-loading">Searching...</div>
        </div>
      )}

      {!isSearching && searchTerm.length > 2 && searchResults.length === 0 && (
        <div className="search-results-zerodha">
          <div className="search-no-results">No stocks found</div>
        </div>
      )}
    </div>
  );
};

export default WatchListSearch;