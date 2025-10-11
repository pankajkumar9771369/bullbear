const express = require('express');
const router = express.Router();
const { 
  getAllPositions, 
  getPositionBySymbol, 
  squareOffPosition 
} = require('../controllers/PositionsController');

router.get('/', getAllPositions);
router.get('/:symbol', getPositionBySymbol);
router.post('/square-off', squareOffPosition);

module.exports = router;