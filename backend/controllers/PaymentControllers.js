require('dotenv').config();  // Load env variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


module.exports.creatPayment = async (req, res) => {
  try {
    // Add debug logging
    console.log("🔍 Payment request received");
    console.log("🔍 req.user:", req.user);
    console.log("🔍 req.userId:", req.userId);
    
    // The user is already verified by your userVerification middleware
    const userId = req.userId || req.user?._id || req.user?.id;
    
    if (!userId) {
      console.log("❌ No user ID in payment request");
      return res.status(400).json({
        success: false,
        error: 'User authentication failed'
      });
    }

    const { amount, currency = 'inr' } = req.body;

    console.log("🔍 Payment amount:", amount, "for user:", userId);

    // Validate the amount
    if (!amount || amount < 50) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least ₹0.50'
      });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString()
      }
    });

    console.log("✅ PaymentIntent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Backend PaymentIntent creation error:', error);
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
    
    res.json({
      success: true,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method: paymentIntent.charges?.data[0]?.payment_method_details?.type || 'card',
      created: new Date(paymentIntent.created * 1000).toLocaleDateString('en-IN')
    });
  } catch (error) {
    console.error('Payment intent retrieval error:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};