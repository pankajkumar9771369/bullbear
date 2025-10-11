require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const axios = require("axios");

const authRoutes = require("./routes/AuthRoute");
const ordersRoutes = require("./routes/OrdersRoute");
const holdingsRoutes = require("./routes/HoldingsRoute");
const positionsRoutes = require("./routes/PositionsRoute");
const paymentRoutes = require("./routes/PaymentRoute");
const fundsRoutes = require("./routes/FundsRoute");
const summaryRoutes = require("./routes/SummaryRoute");
const indicesRoutes = require("./routes/IndicesRoute");
const watchlistRoutes = require("./routes/WatchlistRoute");

const app = express();
const dbUrl = process.env.MONGO_URL ;
const userVerification = require("./Middlewares/AuthMiddleware")
// / Define the list of allowed origins
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true, // ✅ This is CRITICAL for cookies to work
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json())
mongoose.connect(dbUrl,{ useNewUrlParser:true, useUnifiedTopology:true })
.then(()=>console.log("Connected to DB"))
.catch(err=>console.error(err));
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/orders",userVerification, ordersRoutes);
app.use("/api/holdings", userVerification,holdingsRoutes);
app.use("/api/positions",userVerification, positionsRoutes);
app.use("/api/summary", userVerification,summaryRoutes);
app.use("/api/indices", indicesRoutes);
app.use("/api/watchlist",watchlistRoutes);

app.use("/api/payment", userVerification,paymentRoutes);
app.use("/api/funds", userVerification,fundsRoutes);
// Add this to your backend routes
// In your backend API route
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log("1. Search query received:", q);
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const apiUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${q}&apikey=W68CVT873YRHJQNQ`;
    console.log("2. Making request to Alpha Vantage...");
    
    const response = await axios.get(apiUrl);
    console.log("3. Raw Alpha Vantage response:", JSON.stringify(response.data, null, 2));

    // Check for API limitations or errors
    if (response.data.Note) {
      console.log("4. API rate limit note detected:", response.data.Note);
      return res.status(429).json({ error: 'API rate limit exceeded' });
    }

    if (response.data['Error Message']) {
      console.log("4. API error message:", response.data['Error Message']);
      return res.status(500).json({ error: 'Alpha Vantage API error' });
    }

    console.log("4. bestMatches exists:", !!response.data.bestMatches);
    console.log("5. bestMatches content:", response.data.bestMatches);

    const results = response.data.bestMatches ? response.data.bestMatches.map(stock => ({
      '1. symbol': stock['1. symbol'],
      '2. name': stock['2. name'],
      '3. type': stock['3. type'],
      '4. region': stock['4. region'],
      '8. currency': stock['8. currency']
    })) : [];

    console.log("6. Processed results:", results);
    console.log("7. Number of results:", results.length);
    
    res.json(results);
  } catch (err) {
    console.error('8. Search error:', err.message);
    if (err.response) {
      console.error('9. Error response data:', err.response.data);
      console.error('10. Error status:', err.response.status);
    }
    res.status(500).json({ error: 'Search failed' });
  }
});
// Add this to your backend routes
app.get('/api/stocks/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    
    // Fetch current price from Alpha Vantage or your data source
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_API_KEY`
    );
    
    const quoteData = response.data['Global Quote'];
    if (quoteData && quoteData['05. price']) {
      res.json({
        symbol: symbol,
        currentPrice: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        percentChange: parseFloat(quoteData['10. change percent'].replace('%', ''))
      });
    } else {
      res.status(404).json({ error: 'Price data not available' });
    }
  } catch (err) {
    console.error('Price fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});
app.listen(3002,()=>console.log("Server running on port 3002"));
