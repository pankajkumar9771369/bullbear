const express = require('express');
const router = express.Router();
const { 
  addFunds, 
  getUserFunds, 
  withdrawFunds 
} = require('../controllers/FundsController');

router.post('/add', addFunds);
router.get('/my-funds', getUserFunds); // Changed to get from middleware
router.post('/withdraw', withdrawFunds);

module.exports = router;