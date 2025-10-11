// controllers/WatchlistController.js
const { WatchlistModel } = require("../model/WatchlistModel");
const axios = require('axios');

require('dotenv').config();
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Get all watchlist items (auto-display default if empty)
// controllers/WatchlistController.js


// Static fallback data with realistic prices
const STATIC_WATCHLIST = [
  { name: "Apple Inc", symbol: "AAPL", fallbackPrice: 245.27 },
  { name: "Microsoft", symbol: "MSFT", fallbackPrice: 510.96 },
  { name: "Tesla", symbol: "TSLA", fallbackPrice: 413.49 },
  { name: "Amazon", symbol: "AMZN", fallbackPrice: 216.37 },
  { name: "Google", symbol: "GOOGL", fallbackPrice: 236.57 },
];

// Helper function to detect API failures
function isAlphaVantageFailed(error) {
  return (
    error.response?.data?.Information?.includes('rate limit') ||
    error.response?.data?.Note?.includes('API key') ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  );
}

// Helper function to create static response
function createStaticResponse(watchlistItems) {
  return watchlistItems.map(item => ({
    name: item.name,
    symbol: item.symbol,
    currentPrice: item.fallbackPrice || 0,
    change: 0,
    percentChange: 0,
    isLoss: false,
    usingFallback: true
  }));
}

// Enhanced main function
// Enhanced main function - ALWAYS include static companies
module.exports.getAllWatchlist = async (req, res) => {
  try {
    // Get user's watchlist from database
    let userWatchlist = await WatchlistModel.find({}).lean();
    console.log("1. User watchlist from DB:", userWatchlist);

    // ✅ ALWAYS combine static companies + user stocks
    const combinedWatchlist = [];
    const symbolSet = new Set();

    // First, add all static companies
    STATIC_WATCHLIST.forEach(staticStock => {
      symbolSet.add(staticStock.symbol);
      combinedWatchlist.push({
        ...staticStock,
        isStatic: true // Mark as static for tracking
      });
    });

    // Then, add user stocks that aren't already in static list
    userWatchlist.forEach(userStock => {
      if (!symbolSet.has(userStock.symbol)) {
        symbolSet.add(userStock.symbol);
        combinedWatchlist.push({
          ...userStock,
          isStatic: false // Mark as user-added
        });
      }
    });

    console.log("2. Combined watchlist:", combinedWatchlist);

    let alphaVantageFailed = false;
    
    try {
      const updated = await Promise.all(
        combinedWatchlist.map(async (item) => {
          console.log(`3. Fetching data for: ${item.symbol}`);
          
          // If we already know Alpha Vantage is down, skip API call
          if (alphaVantageFailed) {
            console.log(`Skipping ${item.symbol} - API known to be down`);
            return createStaticResponse([item])[0];
          }
          
          try {
            const response = await axios.get(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${item.symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
              { timeout: 10000 }
            );
            
            console.log(`4. Alpha Vantage raw response for ${item.symbol}:`, response.data);

            // Check for API rate limiting or errors in response
            if (response.data.Information && response.data.Information.includes('rate limit')) {
              console.log('Alpha Vantage API rate limit detected');
              alphaVantageFailed = true;
              throw new Error('API rate limited');
            }

            if (response.data['Error Message']) {
              console.log('Alpha Vantage API error:', response.data['Error Message']);
              alphaVantageFailed = true;
              throw new Error('API error message received');
            }

            const quoteData = response.data['Global Quote'];
            
            if (quoteData && quoteData['05. price']) {
              const currentPrice = parseFloat(quoteData['05. price']);
              const previousClose = parseFloat(quoteData['08. previous close']);
              const change = parseFloat(quoteData['09. change']);
              const percentChange = parseFloat(quoteData['10. change percent'].replace('%', ''));

              return {
                name: item.name,
                symbol: item.symbol,
                currentPrice: currentPrice,
                change: change,
                percentChange: percentChange,
                isLoss: change < 0,
                usingFallback: false,
                isStatic: item.isStatic || false
              };
            } else {
              throw new Error('No quote data in response');
            }
          } catch (error) {
            console.error(`5. Error fetching ${item.symbol}:`, error.message);
            
            // Mark API as failed for subsequent requests
            if (isAlphaVantageFailed(error)) {
              alphaVantageFailed = true;
            }
            
            return {
              name: item.name,
              symbol: item.symbol,
              currentPrice: item.fallbackPrice || 0,
              change: 0,
              percentChange: 0,
              isLoss: false,
              usingFallback: true,
              isStatic: item.isStatic || false
            };
          }
        })
      );

      console.log("6. Final watchlist response sent to client");
      console.log(`API Status: ${alphaVantageFailed ? 'Using fallback data' : 'Using live data'}`);
      res.json(updated);

    } catch (batchError) {
      console.error("7. Batch processing failed, using complete static fallback:", batchError);
      // If batch processing fails entirely, return complete static data
      const staticFallback = createStaticResponse(combinedWatchlist);
      res.json(staticFallback);
    }

  } catch (err) {
    console.error("0. Overall controller error, using ultimate fallback:", err);
    // Ultimate fallback - return complete static data
    const ultimateFallback = createStaticResponse(STATIC_WATCHLIST);
    res.json(ultimateFallback);
  }
};

// Keep your existing addToWatchlist and removeFromWatchlist functions
// ... (they remain the same as in your original code)

// Add new company to watchlist from frontend
module.exports.addToWatchlist = async (req, res) => {
  try {
    const { name, symbol, fallbackPrice } = req.body;

    // Validate required fields
    if (!name || !symbol) {
      return res.status(400).json({ 
        message: "Company name and symbol are required" 
      });
    }

    console.log(`Adding new company to watchlist: ${name} (${symbol})`);

    // Check if company already exists in watchlist
    const existingCompany = await WatchlistModel.findOne({ symbol });
    if (existingCompany) {
      return res.status(409).json({ 
        message: "Company already exists in watchlist" 
      });
    }

    // Create new watchlist item
    const newWatchlistItem = new WatchlistModel({
      name,
      symbol,
      fallbackPrice: fallbackPrice || 0
    });

    // Save to database
    const savedItem = await newWatchlistItem.save();
    
    console.log("New company added successfully:", savedItem);
    
    res.status(201).json({
      message: "Company added to watchlist successfully",
      data: savedItem
    });

  } catch (err) {
    console.error("Error adding to watchlist:", err);
    res.status(500).json({ message: err.message });
  }
};

// Remove company from watchlist
module.exports.removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;

    const deletedItem = await WatchlistModel.findOneAndDelete({ symbol });
    
    if (!deletedItem) {
      return res.status(404).json({ 
        message: "Company not found in watchlist" 
      });
    }

    console.log("Company removed from watchlist:", deletedItem);
    res.json({ 
      message: "Company removed from watchlist successfully",
      data: deletedItem
    });

  } catch (err) {
    console.error("Error removing from watchlist:", err);
    res.status(500).json({ message: err.message });
  }
};