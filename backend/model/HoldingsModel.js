const { Schema, model } = require("mongoose");

const HoldingsSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
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
    default: 0 
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
    default: "NSE"
  },
  instrument: {
    type: String,
    enum: ['EQUITY', 'DERIVATIVE', 'MF'],
    default: 'EQUITY'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for better query performance
HoldingsSchema.index({ userId: 1, symbol: 1 });
HoldingsSchema.index({ userId: 1, updatedAt: -1 });

// Update timestamp before saving
HoldingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = { HoldingsModel: model("Holdings", HoldingsSchema) };