const { Schema, model } = require("mongoose");

const PositionsSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  product: { 
    type: String, 
    enum: ['MIS', 'CNC', 'NRML'],
    default: 'MIS' 
  },
  name: { 
    type: String, 
    required: true 
  },
  symbol: { 
    type: String, 
    required: true,
    uppercase: true 
  },
  qty: { 
    type: Number, 
    required: true,
    min: 0 
  },
  avg: { 
    type: Number, 
    required: true,
    min: 0 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  net: { 
    type: String, 
    default: "0.00" 
  },
  day: { 
    type: String, 
    default: "0.00" 
  },
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    default: 'NSE'
  },
  instrument: {
    type: String,
    enum: ['EQUITY', 'FUTURES', 'OPTIONS'],
    default: 'EQUITY'
  },
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercentage: {
    type: Number,
    default: 0
  },
  dayPnl: {
    type: Number,
    default: 0
  },
  dayPnlPercentage: {
    type: Number,
    default: 0
  },
  livePrice: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  changePercentage: {
    type: Number,
    default: 0
  },
  isLoss: { 
    type: Boolean, 
    default: false 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better performance
PositionsSchema.index({ userId: 1, symbol: 1 });
PositionsSchema.index({ userId: 1, product: 1 });
PositionsSchema.index({ userId: 1, lastUpdated: -1 });

// Virtual for current value
PositionsSchema.virtual('currentValue').get(function() {
  return this.livePrice * this.qty;
});

// Virtual for investment value
PositionsSchema.virtual('investmentValue').get(function() {
  return this.avg * this.qty;
});

// Update timestamp before saving
PositionsSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  
  // Calculate P&L
  const investment = this.avg * this.qty;
  const currentValue = this.livePrice * this.qty;
  this.pnl = currentValue - investment;
  this.pnlPercentage = investment > 0 ? (this.pnl / investment) * 100 : 0;
  this.isLoss = this.pnl < 0;
  
  next();
});

module.exports = { PositionsModel: model("Positions", PositionsSchema) };