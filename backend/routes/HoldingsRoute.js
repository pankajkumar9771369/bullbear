const express = require('express');
const router = express.Router();
const { 
  getAllHoldings, 
  addHolding, 
  updateHolding, 
  deleteHolding 
} = require('../controllers/HoldingsController');

router.get('/', getAllHoldings);
router.post('/', addHolding);
router.put('/:id', updateHolding);
router.delete('/:id', deleteHolding);

module.exports = router;