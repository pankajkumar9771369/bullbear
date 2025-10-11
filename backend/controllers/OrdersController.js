const { OrdersModel } = require("../model/OrdersModel");
const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { FundsModel } = require("../model/FundsModel");

module.exports.createOrder = async (req, res) => {
  try {
    const { name, symbol, qty, price, mode, orderType, product, exchange, paymentIntentId } = req.body;
    const userId = req.user._id;

    // ✅ ADD DUPLICATE PREVENTION CHECK
    if (paymentIntentId) {
      const existingOrder = await OrdersModel.findOne({ 
        paymentIntentId: paymentIntentId,
        userId: userId
      });

      if (existingOrder) {
        console.log("🔄 Order already exists for paymentIntent:", paymentIntentId);
        return res.status(200).json({
          success: true,
          message: "Order already exists",
          data: {
            orderId: existingOrder.orderId,
            symbol: existingOrder.symbol,
            quantity: existingOrder.qty,
            price: existingOrder.price,
            mode: existingOrder.mode,
            totalAmount: existingOrder.totalAmount,
            status: existingOrder.status,
            createdAt: existingOrder.createdAt
          }
        });
      }
    }

    // Validate input
    if (!name || !symbol || !qty || !price || !mode) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, symbol, qty, price, mode"
      });
    }

    if (!['BUY', 'SELL'].includes(mode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Mode must be either BUY or SELL"
      });
    }

    const totalAmount = qty * price;

    // Create order
    const order = new OrdersModel({ 
      userId,
      name, 
      symbol: symbol.toUpperCase(), 
      qty: parseInt(qty), 
      price: parseFloat(price), 
      mode: mode.toUpperCase(),
      orderType: orderType || 'MARKET',
      product: product || 'MIS',
      exchange: exchange || 'NSE',
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paymentIntentId: paymentIntentId
    });

    await order.save();

    // Update holdings for CNC orders
    if (product === 'CNC' || !['MIS', 'NRML'].includes(product)) {
      await updateHoldings(userId, order);
    }

    // Update positions
    await updatePositions(userId, order);

    // Update funds - using positive amounts only
    await updateFunds(userId, order);

    console.log("✅ Order created successfully:", order.orderId);

    res.status(201).json({ 
      success: true,
      message: "Order executed successfully",
      data: {
        orderId: order.orderId,
        symbol: order.symbol,
        quantity: order.qty,
        price: order.price,
        mode: order.mode,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error("Error in createOrder:", err);
    res.status(500).json({ 
      success: false,
      message: "Order execution failed",
      error: err.message 
    });
  }
};
// Update holdings for delivery trades
async function updateHoldings(userId, order) {
  let holding = await HoldingsModel.findOne({ userId, symbol: order.symbol });

  if (order.mode === 'BUY') {
    if (holding) {
      // Update existing holding
      const totalQty = holding.qty + order.qty;
      const totalCost = (holding.avg * holding.qty) + (order.price * order.qty);
      holding.avg = parseFloat((totalCost / totalQty).toFixed(2));
      holding.qty = totalQty;
      holding.price = order.price;
      await holding.save();
    } else {
      // Create new holding
      holding = new HoldingsModel({ 
        userId,
        name: order.name, 
        symbol: order.symbol, 
        qty: order.qty, 
        avg: order.price, 
        price: order.price,
        exchange: order.exchange,
        instrument: 'EQUITY'
      });
      await holding.save();
    }
  } else if (order.mode === 'SELL') {
    if (holding) {
      if (holding.qty < order.qty) {
        throw new Error(`Insufficient holdings. Available: ${holding.qty}, Requested: ${order.qty}`);
      }
      
      holding.qty -= order.qty;
      if (holding.qty === 0) {
        await HoldingsModel.findByIdAndDelete(holding._id);
      } else {
        await holding.save();
      }
    } else {
      throw new Error("No holdings found for this symbol");
    }
  }
}

// Update positions
async function updatePositions(userId, order) {
  let position = await PositionsModel.findOne({ userId, symbol: order.symbol });

  if (position) {
    if (order.mode === 'BUY') {
      const totalQty = position.qty + order.qty;
      const totalCost = (position.avg * position.qty) + (order.price * order.qty);
      position.avg = parseFloat((totalCost / totalQty).toFixed(2));
      position.qty = totalQty;
    } else {
      position.qty -= order.qty;
      if (position.qty === 0) {
        await PositionsModel.findByIdAndDelete(position._id);
        return;
      }
    }
    position.price = order.price;
    await position.save();
  } else {
    if (order.mode === 'BUY') {
      position = new PositionsModel({ 
        userId,
        name: order.name, 
        symbol: order.symbol,
        product: order.product, 
        qty: order.qty, 
        avg: order.price, 
        price: order.price,
        exchange: order.exchange
      });
      await position.save();
    }
  }
}

// Update funds based on order
// Update funds based on order - FIXED for your schema with min: 0
// Update funds based on order - with duplicate prevention
async function updateFunds(userId, order) {
  // Check if a funds record already exists for this paymentIntentId
  if (order.paymentIntentId) {
    const existingFund = await FundsModel.findOne({ 
      paymentIntentId: order.paymentIntentId 
    });
    
    if (existingFund) {
      console.log("💰 Funds record already exists for payment:", order.paymentIntentId);
      return; // Skip creating duplicate record
    }
  }

  const amount = order.totalAmount;
  const description = `${order.mode} ${order.qty} ${order.symbol} @ ${order.price}`;

  if (order.mode === 'BUY') {
    const fund = new FundsModel({
      userId,
      amount: amount,
      type: 'investment',
      description: description,
      paymentIntentId: order.paymentIntentId,
      status: 'completed'
    });
    await fund.save();
    console.log("✅ Funds record created for BUY order");
  } else {
    const fund = new FundsModel({
      userId,
      amount: amount,
      type: 'add',
      description: description,
      status: 'completed'
    });
    await fund.save();
    console.log("✅ Funds record created for SELL order");
  }
}

module.exports.getAllOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, symbol, status, mode } = req.query;

    // Build filter
    const filter = { userId };
    if (symbol) filter.symbol = symbol.toUpperCase();
    if (status) filter.status = status.toUpperCase();
    if (mode) filter.mode = mode.toUpperCase();

    const orders = await OrdersModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-paymentIntentId -__v');

    const total = await OrdersModel.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (err) {
    console.error("Error in getAllOrders:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders",
      error: err.message 
    });
  }
};

// Get order by ID
module.exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await OrdersModel.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error("Error in getOrderById:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch order",
      error: err.message 
    });
  }
};

// Cancel order
module.exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await OrdersModel.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled"
      });
    }

    order.status = 'CANCELLED';
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });
  } catch (err) {
    console.error("Error in cancelOrder:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to cancel order",
      error: err.message 
    });
  }
};