const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getAllOrders, 
  getOrderById, 
  cancelOrder 
} = require('../controllers/OrdersController');

router.post('/create', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;