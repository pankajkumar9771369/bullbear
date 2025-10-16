require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { FundsModel } = require('../model/FundsModel');

module.exports.creatPayment = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User authentication failed'
      });
    }

    let { amount, currency = 'inr' } = req.body;

    console.log("✅ Received from frontend (rupees):", amount, "Type:", typeof amount);

    // Convert to number and validate
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // ✅ Convert rupees to paise for Stripe
    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least ₹1'
      });
    }

    console.log("💰 Converting to paise for Stripe:", amount, "rupees →", amountInPaise, "paise");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise, // Stripe expects paise
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { 
        userId: userId.toString(),
        originalAmountRupees: amount.toString() // Store original rupees
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('PaymentIntent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};

module.exports.getPaymentIntent = async (req, res) => {
  try {
    const paymentIntentId = req.params.paymentIntentId;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { 
      expand: ['charges'] 
    });

    console.log("🔄 Stripe payment intent:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount, // This is in paise
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    // ✅ CRITICAL FIX: Convert Stripe paise to rupees for database
    const amountInRupees = paymentIntent.amount / 100;

    console.log("💾 Converting to rupees for DB:", paymentIntent.amount, "paise →", amountInRupees, "rupees");

    // Save to DB only if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      const existing = await FundsModel.findOne({ paymentIntentId: paymentIntent.id });
      if (!existing) {
        const fund = new FundsModel({
          userId: paymentIntent.metadata.userId,
          amount: amountInRupees, // ✅ SAVE IN RUPEES
          type: 'add',
          paymentIntentId: paymentIntent.id,
          description: `Funds added via Stripe - ₹${amountInRupees}`,
          status: 'completed'
        });
        
        await fund.save();
        
        console.log("✅ Saved to database:", {
          amountInRupees: amountInRupees,
          paymentIntentId: paymentIntent.id,
          userId: paymentIntent.metadata.userId
        });

        // Verify the saved data
        const savedFund = await FundsModel.findOne({ paymentIntentId: paymentIntent.id });
        console.log("🔍 Verified saved data:", savedFund);
      } else {
        console.log("⚠️ Payment already processed in database");
      }
    }

    res.json({
      success: true,
      id: paymentIntent.id,
      amount: amountInRupees, // Return rupees to frontend
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method: paymentIntent.charges?.data[0]?.payment_method_details?.type || 'card',
      created: new Date(paymentIntent.created * 1000).toLocaleDateString('en-IN')
    });

  } catch (error) {
    console.error('PaymentIntent retrieval error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};