const finnhub = require("finnhub");
const client = new finnhub.DefaultApi(process.env.FINNHUB_API_KEY);
module.exports = client;
