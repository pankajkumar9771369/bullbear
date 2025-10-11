const { Schema, model } = require("mongoose");

const OrdersSchema = new Schema({
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
    min: 1 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  mode: { 
    type: String, 
    enum: ['BUY', 'SELL'],
    required: true 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
    default: 'COMPLETED'
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
    default: 'MARKET'
  },
  product: {
    type: String,
    enum: ['MIS', 'CNC', 'NRML'],
    default: 'MIS'
  },
  exchange: {
    type: String,
    enum: ['NSE', 'BSE'],
    default: 'NSE'
  },
  paymentIntentId: String,
  orderId: {
    type: String,
    unique: true
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

// Indexes for better performance
OrdersSchema.index({ userId: 1, createdAt: -1 });
OrdersSchema.index({ symbol: 1 });
OrdersSchema.index({ status: 1 });
OrdersSchema.index({ orderId: 1 });

// Update timestamp before saving
OrdersSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate order ID if not present
  if (!this.orderId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderId = `ORD${timestamp}${random}`;
  }
  
  next();
});

module.exports = { OrdersModel: model("Orders", OrdersSchema) };