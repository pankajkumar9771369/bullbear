const { Schema, model } = require("mongoose");

const FundsSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: "User" 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  type: { 
    type: String, 
    enum: ['add', 'withdraw', 'investment'], 
    required: true 
  },
  paymentIntentId: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  createdAt: { type: Date, default: Date.now }
});

// Index for better query performance
FundsSchema.index({ userId: 1, createdAt: -1 });
FundsSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });

// Get user's total funds
FundsSchema.statics.getUserFunds = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'add'] },
              '$amount',
              { $multiply: ['$amount', -1] }
            ]
          }
        }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Get available balance (excluding investments)
FundsSchema.statics.getAvailableBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: userId, status: 'completed' } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  let totalAdd = 0;
  let totalWithdraw = 0;
  let totalInvestment = 0;
  
  result.forEach(item => {
    if (item._id === 'add') totalAdd = item.total;
    if (item._id === 'withdraw') totalWithdraw = item.total;
    if (item._id === 'investment') totalInvestment = item.total;
  });
  
  return totalAdd - totalWithdraw - totalInvestment;
};

module.exports = { FundsModel: model("Funds", FundsSchema) };