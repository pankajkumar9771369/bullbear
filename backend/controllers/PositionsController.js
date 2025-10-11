const { PositionsModel } = require("../model/PositionsModel");
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = "W68CVT873YRHJQNQ";

// Cache for stock prices
const priceCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

module.exports.getAllPositions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const positions = await PositionsModel.find({ userId });
    
    if (positions.length === 0) {
      return res.json({
        success: true,
        data: [],
        summary: {
          totalInvestment: 0,
          totalCurrentValue: 0,
          totalPnl: 0,
          totalPnlPercentage: 0,
          dayPnl: 0,
          dayPnlPercentage: 0
        }
      });
    }

    const updatedPositions = await Promise.all(
      positions.map(async (position) => {
        try {
          const liveData = await getLiveStockData(position.symbol);
          const livePrice = liveData.price;
          const change = liveData.change || 0;
          const percentChange = liveData.percentChange || 0;

          // Calculate P&L metrics
          const investment = position.avg * position.qty;
          const currentValue = livePrice * position.qty;
          const pnl = currentValue - investment;
          const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;
          const dayPnl = (change * position.qty);
          const dayPnlPercentage = position.price > 0 ? (change / position.price) * 100 : 0;

          // Update position with live data
          position.livePrice = livePrice;
          position.change = change;
          position.changePercentage = percentChange;
          position.pnl = parseFloat(pnl.toFixed(2));
          position.pnlPercentage = parseFloat(pnlPercentage.toFixed(2));
          position.dayPnl = parseFloat(dayPnl.toFixed(2));
          position.dayPnlPercentage = parseFloat(dayPnlPercentage.toFixed(2));
          position.isLoss = pnl < 0;
          position.lastUpdated = new Date();

          await position.save();

          return {
            id: position._id,
            name: position.name,
            symbol: position.symbol,
            product: position.product,
            quantity: position.qty,
            averagePrice: position.avg,
            lastPrice: position.price,
            livePrice: livePrice,
            change: change,
            changePercentage: percentChange,
            investment: investment.toFixed(2),
            currentValue: currentValue.toFixed(2),
            pnl: pnl.toFixed(2),
            pnlPercentage: pnlPercentage.toFixed(2),
            dayPnl: dayPnl.toFixed(2),
            dayPnlPercentage: dayPnlPercentage.toFixed(2),
            isLoss: pnl < 0,
            exchange: position.exchange,
            instrument: position.instrument,
            lastUpdated: position.lastUpdated
          };
        } catch (error) {
          console.error(`Error processing position ${position.symbol}:`, error.message);
          return getFallbackPositionData(position);
        }
      })
    );

    // Calculate portfolio summary
    const summary = calculatePositionsSummary(updatedPositions);

    res.json({
      success: true,
      data: updatedPositions,
      summary: summary,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in getAllPositions:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch positions",
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
function getFallbackPositionData(position) {
  const investment = position.avg * position.qty;
  const currentValue = position.livePrice * position.qty;
  const pnl = currentValue - investment;
  const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;

  return {
    id: position._id,
    name: position.name,
    symbol: position.symbol,
    product: position.product,
    quantity: position.qty,
    averagePrice: position.avg,
    lastPrice: position.price,
    livePrice: position.livePrice || position.price,
    change: position.change || 0,
    changePercentage: position.changePercentage || 0,
    investment: investment.toFixed(2),
    currentValue: currentValue.toFixed(2),
    pnl: pnl.toFixed(2),
    pnlPercentage: pnlPercentage.toFixed(2),
    dayPnl: position.dayPnl || 0,
    dayPnlPercentage: position.dayPnlPercentage || 0,
    isLoss: pnl < 0,
    exchange: position.exchange,
    instrument: position.instrument,
    lastUpdated: position.lastUpdated
  };
}

// Calculate positions summary
function calculatePositionsSummary(positions) {
  const summary = positions.reduce((acc, position) => {
    acc.totalInvestment += parseFloat(position.investment);
    acc.totalCurrentValue += parseFloat(position.currentValue);
    acc.totalPnl += parseFloat(position.pnl);
    acc.totalDayPnl += parseFloat(position.dayPnl);
    return acc;
  }, {
    totalInvestment: 0,
    totalCurrentValue: 0,
    totalPnl: 0,
    totalDayPnl: 0
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

// Get position by symbol
module.exports.getPositionBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;

    const position = await PositionsModel.findOne({ userId, symbol: symbol.toUpperCase() });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Update with live data
    try {
      const liveData = await getLiveStockData(position.symbol);
      position.livePrice = liveData.price;
      position.change = liveData.change;
      position.changePercentage = liveData.percentChange;
      await position.save();
    } catch (error) {
      console.error(`Error updating live data for ${position.symbol}:`, error.message);
    }

    res.json({
      success: true,
      data: position
    });
  } catch (err) {
    console.error("Error in getPositionBySymbol:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch position",
      error: err.message 
    });
  }
};

// Square off position
module.exports.squareOffPosition = async (req, res) => {
  try {
    const { symbol, price } = req.body;
    const userId = req.user._id;

    const position = await PositionsModel.findOne({ userId, symbol: symbol.toUpperCase() });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found"
      });
    }

    // Calculate final P&L
    const squareOffPrice = price || position.livePrice;
    const investment = position.avg * position.qty;
    const currentValue = squareOffPrice * position.qty;
    const finalPnl = currentValue - investment;

    // Delete the position (square off)
    await PositionsModel.findByIdAndDelete(position._id);

    res.json({
      success: true,
      message: "Position squared off successfully",
      data: {
        symbol: position.symbol,
        quantity: position.qty,
        averagePrice: position.avg,
        squareOffPrice: squareOffPrice,
        pnl: parseFloat(finalPnl.toFixed(2)),
        pnlPercentage: parseFloat(((finalPnl / investment) * 100).toFixed(2))
      }
    });
  } catch (err) {
    console.error("Error in squareOffPosition:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to square off position",
      error: err.message 
    });
  }
};