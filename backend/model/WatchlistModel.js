const { Schema, model } = require("mongoose");

const WatchlistSchema = new Schema({
  name: String,  // stock symbol e.g., TCS, INFY
  symbol: String, // Finnhub symbol e.g., "NSE:TCS"
    fallbackPrice: Number
});

module.exports = { WatchlistModel: model("Watchlist", WatchlistSchema) };
