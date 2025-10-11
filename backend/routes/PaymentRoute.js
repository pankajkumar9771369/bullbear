const router = require('express').Router();
const { creatPayment, getPaymentIntent } = require('../controllers/PaymentControllers');
router.post('/create-payment-intent', creatPayment);
router.get('/payment-intent/:paymentIntentId', getPaymentIntent);
module.exports = router;