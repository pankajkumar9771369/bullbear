const { FundsModel } = require("../model/FundsModel");

// Add funds after successful payment
module.exports.addFunds = async (req, res) => {
  try {
    const { amount, paymentIntentId, description } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Valid amount is required" 
      });
    }

    const fund = new FundsModel({
      userId,
      amount: Math.round(amount),
      type: 'add',
      paymentIntentId,
      description: description || 'Funds added via payment',
      status: 'completed'
    });
    
    await fund.save();
    
    const totalFunds = await FundsModel.getUserFunds(userId);
    
    res.status(201).json({ 
      success: true,
      message: "Funds added successfully",
      data: {
        addedAmount: amount,
        totalFunds: totalFunds,
        transactionId: fund._id
      }
    });
  } catch (err) {
    console.error("Error adding funds:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};

// Get user's current funds - FIXED VERSION
module.exports.getUserFunds = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Calculate total funds using the same logic as FundsModel.getUserFunds
    const fundsBreakdown = await FundsModel.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      { 
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Convert array to object for easier access
    const fundsByType = {};
    fundsBreakdown.forEach(item => {
      fundsByType[item._id] = item.total;
    });

    // Calculate totals
    const totalAdded = fundsByType['add'] || 0;
    const totalWithdrawn = fundsByType['withdraw'] || 0;
    const totalInvestment = fundsByType['investment'] || 0;

    // Total funds = (add - withdraw) - this matches your getUserFunds static method
    const totalFunds = totalAdded - totalWithdrawn;
    
    // Available balance = total funds minus investments
    const availableBalance = totalFunds - totalInvestment;

    // Get funds history
    const fundsHistory = await FundsModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        totalFunds: totalFunds,
        availableBalance: availableBalance,
        investedAmount: totalInvestment,
        fundsBreakdown: {
          totalAdded: totalAdded,
          totalWithdrawn: totalWithdrawn,
          totalInvestment: totalInvestment
        },
        fundsHistory: fundsHistory.map(fund => ({
          id: fund._id,
          amount: fund.amount,
          type: fund.type,
          description: fund.description,
          date: fund.createdAt,
          paymentIntentId: fund.paymentIntentId,
          status: fund.status
        }))
      }
    });
  } catch (err) {
    console.error("Error getting funds:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};

// Withdraw funds - FIXED VERSION
module.exports.withdrawFunds = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Valid withdrawal amount is required" 
      });
    }

    // Check available balance using same calculation as getUserFunds
    const fundsBreakdown = await FundsModel.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      { 
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const fundsByType = {};
    fundsBreakdown.forEach(item => {
      fundsByType[item._id] = item.total;
    });

    const totalAdded = fundsByType['add'] || 0;
    const totalWithdrawn = fundsByType['withdraw'] || 0;
    const totalInvestment = fundsByType['investment'] || 0;

    const totalFunds = totalAdded - totalWithdrawn;
    const availableBalance = totalFunds - totalInvestment;

    if (availableBalance < amount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient available funds. Available: ${availableBalance}, Requested: ${amount}` 
      });
    }

    const fund = new FundsModel({
      userId,
      amount: amount,
      type: 'withdraw',
      description: description || 'Funds withdrawal',
      status: 'completed'
    });
    
    await fund.save();
    
    // Get updated balance
    const updatedBreakdown = await FundsModel.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      { 
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const updatedByType = {};
    updatedBreakdown.forEach(item => {
      updatedByType[item._id] = item.total;
    });

    const updatedTotal = (updatedByType['add'] || 0) - (updatedByType['withdraw'] || 0);
    
    res.status(201).json({ 
      success: true,
      message: "Funds withdrawn successfully",
      data: {
        withdrawnAmount: amount,
        totalFunds: updatedTotal,
        availableBalance: updatedTotal - (updatedByType['investment'] || 0),
        transactionId: fund._id
      }
    });
  } catch (err) {
    console.error("Error withdrawing funds:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};

// Get funds breakdown for debugging
module.exports.getFundsBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const fundsBreakdown = await FundsModel.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      { 
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const fundsByType = {};
    fundsBreakdown.forEach(item => {
      fundsByType[item._id] = {
        total: item.total,
        count: item.count
      };
    });

    const totalAdded = fundsByType['add']?.total || 0;
    const totalWithdrawn = fundsByType['withdraw']?.total || 0;
    const totalInvestment = fundsByType['investment']?.total || 0;

    const totalFunds = totalAdded - totalWithdrawn;
    const availableBalance = totalFunds - totalInvestment;

    res.json({
      success: true,
      data: {
        breakdown: fundsByType,
        summary: {
          totalFunds: totalFunds,
          availableBalance: availableBalance,
          investedAmount: totalInvestment,
          calculation: `(${totalAdded} - ${totalWithdrawn}) - ${totalInvestment} = ${availableBalance}`
        }
      }
    });
  } catch (err) {
    console.error("Error getting funds breakdown:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: err.message 
    });
  }
};