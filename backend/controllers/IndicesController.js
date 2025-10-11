// controllers/indicesController.js
const axios = require('axios');

// Define multiple indices with their symbols and fallback values
const indexConfigs = [
  { name: "nifty", symbol: "NSEI", fallbackValue: 18200.55 },
  { name: "sensex", symbol: "BSESN", fallbackValue: 61000.25 },
  { name: "niftyBank", symbol: "NSEBANK", fallbackValue: 38500.75 },
  { name: "niftyIt", symbol: "CNXIT", fallbackValue: 28500.30 },
  { name: "bseMidcap", symbol: "BSEMIDCAP", fallbackValue: 15500.40 },
  { name: "bseSmallcap", symbol: "BSESMALLCAP", fallbackValue: 12500.60 }
];

module.exports.getIndices = async (req, res) => {
  try {
    const indicesData = {};
    
    // Fetch data for all indices
    await Promise.all(
      indexConfigs.map(async (index) => {
        try {
          // Replace this with actual API call to your data source
          // const response = await axios.get(`your-api-endpoint/${index.symbol}`);
          // indicesData[index.name] = response.data.currentPrice;
          
          // For now, using fallback values
          indicesData[index.name] = index.fallbackValue + (Math.random() * 100 - 50); // Mock data variation
        } catch (error) {
          console.error(`Error fetching ${index.name}:`, error.message);
          indicesData[index.name] = index.fallbackValue;
        }
      })
    );

    console.log("Sending indices data:", indicesData);
    res.json(indicesData);
  } catch (err) {
    console.error("Failed to fetch indices:", err.message);
    // Return fallback data in case of error
    const fallbackData = {};
    indexConfigs.forEach(index => {
      fallbackData[index.name] = index.fallbackValue;
    });
    res.json(fallbackData);
  }
};