const { HoldingsModel } = require("../model/HoldingsModel");
const User = require("../model/UserModel"); // Use same import as middleware
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = "W68CVT873YRHJQNQ";

module.exports.getSummary = async (req, res) => {
  try {
    // Add detailed debugging
    console.log("🔍 Full req.user:", req.user);
    console.log("🔍 req.userId:", req.userId);
    console.log("🔍 req.user._id:", req.user?._id);
    
    // Get user ID from the middleware - try multiple approaches
    const userId = req.userId || req.user?._id || req.user?.id;
    
    console.log("🔍 Extracted userId:", userId);
    
    if (!userId) {
      console.log("❌ No user ID found in request object");
      return res.status(400).json({ 
        message: "User ID is required - authentication failed" 
      });
    }

    console.log("✅ Processing summary for user ID:", userId);

    // Find user in database - use consistent model name
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found in database for ID:", userId);
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    console.log("✅ User found:", user.username);

    // Fetch holdings for the specific user
    const holdings = await HoldingsModel.find({ user: userId });
    console.log("✅ Holdings found:", holdings.length);

    let totalInvested = 0;
    let currentValue = 0;
    let holdingsCount = holdings.length;

    // Calculate values using live prices from Alpha Vantage
    const holdingsWithLiveData = await Promise.all(
      holdings.map(async (holding) => {
        try {
          // Get live price from Alpha Vantage
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${holding.symbol || holding.name}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          
          const quoteData = response.data['Global Quote'];
          let livePrice = holding.price; // Fallback to stored price
          
          if (quoteData && quoteData['05. price']) {
            livePrice = parseFloat(quoteData['05. price']);
          }

          const investedValue = holding.avg * holding.qty;
          const currentHoldingValue = livePrice * holding.qty;
          const holdingPnl = currentHoldingValue - investedValue;
          const holdingPnlPercent = investedValue ? (holdingPnl / investedValue) * 100 : 0;

          return {
            ...holding._doc,
            livePrice,
            currentValue: currentHoldingValue,
            investedValue,
            pnl: holdingPnl,
            pnlPercent: holdingPnlPercent,
            isLoss: holdingPnl < 0
          };
        } catch (error) {
          console.error(`Error fetching live price for ${holding.name}:`, error.message);
          // Use stored values if API fails
          const investedValue = holding.avg * holding.qty;
          const currentHoldingValue = holding.price * holding.qty;
          const holdingPnl = currentHoldingValue - investedValue;
          const holdingPnlPercent = investedValue ? (holdingPnl / investedValue) * 100 : 0;

          return {
            ...holding._doc,
            livePrice: holding.price,
            currentValue: currentHoldingValue,
            investedValue,
            pnl: holdingPnl,
            pnlPercent: holdingPnlPercent,
            isLoss: holdingPnl < 0
          };
        }
      })
    );

    // Calculate totals from live data
    holdingsWithLiveData.forEach((h) => {
      totalInvested += h.investedValue;
      currentValue += h.currentValue;
    });

    const pnl = currentValue - totalInvested;
    const pnlPercent = totalInvested ? (pnl / totalInvested) * 100 : 0;

    // Calculate margin based on portfolio value (you can adjust this logic)
    const marginAvailable = Math.max(0, 100000 - (currentValue * 0.1)); // Example: 100k base minus 10% of portfolio
    const marginUsed = currentValue * 0.1; // Example: 10% of portfolio used as margin

    // Calculate additional metrics
    const dayChange = pnl * 0.02; // Mock daily change (2% of total P&L)
    const dayChangePercent = 2.0; // Mock 2% daily change

    res.json({
      // User Info - use actual user data
      userName: user.username || "GF", // Use username since your schema has username, not name
      userId: user._id,
      
      // Margin Information
      marginAvailable: marginAvailable.toFixed(2),
      marginUsed: marginUsed.toFixed(2),
      openingBalance: "100000.00", // Example opening balance
      
      // Portfolio Summary
      holdingsCount,
      totalInvested: totalInvested.toFixed(2),
      currentValue: currentValue.toFixed(2),
      investment: totalInvested.toFixed(2), // Alias for totalInvested
      
      // Profit & Loss
      pnl: pnl.toFixed(2),
      pnlPercent: pnlPercent.toFixed(2),
      isLoss: pnl < 0,
      
      // Daily Performance
      dayChange: dayChange.toFixed(2),
      dayChangePercent: dayChangePercent.toFixed(2),
      isDayPositive: dayChange >= 0,
      
      // Additional Metrics
      availableCash: (marginAvailable + currentValue * 0.5).toFixed(2), // Example
      collateralValue: (currentValue * 0.8).toFixed(2), // Example: 80% of portfolio as collateral
      
      // Portfolio Allocation (example)
      equityAllocation: 85, // Percentage
      cashAllocation: 15,   // Percentage
      
      // Risk Metrics (example)
      portfolioBeta: 1.2,   // Example beta
      volatility: 15.5,     // Example volatility percentage
      
      // Timestamp
      lastUpdated: new Date().toISOString()
    });

  } catch (err) {
    console.error("Error in getSummary:", err);
    res.status(500).json({ 
      message: err.message,
      fallbackData: {
        marginAvailable: "150000.00",
        marginUsed: "75500.00",
        holdingsCount: 0,
        totalInvested: "0.00",
        currentValue: "0.00",
        investment: "0.00",
        pnl: "0.00",
        pnlPercent: "0.00",
        isLoss: false,
        userName: "GF"
      }
    });
  }
};