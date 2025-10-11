const { HoldingsModel } = require("../model/HoldingsModel");
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = "W68CVT873YRHJQNQ";

// Cache for stock prices to avoid multiple API calls
const priceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

module.exports.getAllHoldings = async (req, res) => {
  try {
    const userId = req.user._id; // Get from middleware
    
    const holdings = await HoldingsModel.find({ userId });
    
    if (holdings.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: {
          totalInvestment: 0,
          currentValue: 0,
          totalPnl: 0,
          totalPnlPercentage: 0,
          dayPnl: 0
        }
      });
    }

    const updatedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        try {
          const liveData = await getLiveStockData(holding.symbol);
          const livePrice = liveData.price;
          const change = liveData.change || 0;
          const percentChange = liveData.percentChange || 0;
          
          const currentValue = livePrice * holding.qty;
          const investment = holding.avg * holding.qty;
          const pnl = currentValue - investment;
          const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;
          const dayPnl = (change * holding.qty);

          return {
            id: holding._id,
            name: holding.name,
            symbol: holding.symbol,
            quantity: holding.qty,
            averagePrice: holding.avg,
            lastPrice: holding.price,
            livePrice: livePrice,
            change: change,
            changePercentage: percentChange,
            investment: investment.toFixed(2),
            currentValue: currentValue.toFixed(2),
            pnl: pnl.toFixed(2),
            pnlPercentage: pnlPercentage.toFixed(2),
            dayPnl: dayPnl.toFixed(2),
            exchange: holding.exchange,
            instrument: holding.instrument
          };
        } catch (error) {
          console.error(`Error processing ${holding.symbol}:`, error.message);
          return getFallbackHoldingData(holding);
        }
      })
    );

    // Calculate portfolio summary
    const summary = calculatePortfolioSummary(updatedHoldings);

    res.json({
      success: true,
      data: updatedHoldings,
      summary: summary,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in getAllHoldings:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch holdings",
      error: err.message 
    });
  }
};

// Get live stock data with caching
async function getLiveStockData(symbol) {
  const cacheKey = symbol;
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.NS&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    const quoteData = response.data['Global Quote'];
    if (quoteData && quoteData['05. price']) {
      const data = {
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        percentChange: parseFloat(quoteData['10. change percent'].replace('%', ''))
      };
      
      priceCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
    } else {
      throw new Error('No price data available');
    }
  } catch (error) {
    console.error(`Alpha Vantage API error for ${symbol}:`, error.message);
    throw error;
  }
}

// Fallback data when API fails
function getFallbackHoldingData(holding) {
  const currentValue = (holding.price || holding.avg) * holding.qty;
  const investment = holding.avg * holding.qty;
  const pnl = currentValue - investment;
  const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;

  return {
    id: holding._id,
    name: holding.name,
    symbol: holding.symbol,
    quantity: holding.qty,
    averagePrice: holding.avg,
    lastPrice: holding.price,
    livePrice: holding.price || holding.avg,
    change: 0,
    changePercentage: 0,
    investment: investment.toFixed(2),
    currentValue: currentValue.toFixed(2),
    pnl: pnl.toFixed(2),
    pnlPercentage: pnlPercentage.toFixed(2),
    dayPnl: "0.00",
    exchange: holding.exchange,
    instrument: holding.instrument
  };
}

// Calculate portfolio summary
function calculatePortfolioSummary(holdings) {
  const summary = holdings.reduce((acc, holding) => {
    acc.totalInvestment += parseFloat(holding.investment);
    acc.currentValue += parseFloat(holding.currentValue);
    acc.totalPnl += parseFloat(holding.pnl);
    acc.dayPnl += parseFloat(holding.dayPnl);
    return acc;
  }, {
    totalInvestment: 0,
    currentValue: 0,
    totalPnl: 0,
    dayPnl: 0
  });

  summary.totalPnlPercentage = summary.totalInvestment > 0 ? 
    (summary.totalPnl / summary.totalInvestment) * 100 : 0;

  // Format numbers
  Object.keys(summary).forEach(key => {
    if (typeof summary[key] === 'number') {
      summary[key] = parseFloat(summary[key].toFixed(2));
    }
  });

  return summary;
}

// Add new holding
module.exports.addHolding = async (req, res) => {
  try {
    const { name, symbol, qty, avg, exchange, instrument } = req.body;
    const userId = req.user._id;

    const holding = new HoldingsModel({
      userId,
      name,
      symbol: symbol.toUpperCase(),
      qty,
      avg,
      exchange: exchange || 'NSE',
      instrument: instrument || 'EQUITY'
    });

    await holding.save();
    
    res.status(201).json({
      success: true,
      message: "Holding added successfully",
      data: holding
    });
  } catch (err) {
    console.error("Error adding holding:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add holding",
      error: err.message 
    });
  }
};

// Update holding
module.exports.updateHolding = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;

    const holding = await HoldingsModel.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: "Holding not found"
      });
    }

    res.json({
      success: true,
      message: "Holding updated successfully",
      data: holding
    });
  } catch (err) {
    console.error("Error updating holding:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update holding",
      error: err.message 
    });
  }
};

// Delete holding
module.exports.deleteHolding = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const holding = await HoldingsModel.findOneAndDelete({ _id: id, userId });

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: "Holding not found"
      });
    }

    res.json({
      success: true,
      message: "Holding deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting holding:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete holding",
      error: err.message 
    });
  }
};