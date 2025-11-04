const express = require('express');
const {
  startGame,
  endGame,
  saveGameProgress,
  addCatch,
  getGameSession
} = require('../controllers/gameController');

const router = express.Router();

// Game session routes
router.post('/start', startGame);
router.patch('/:sessionId/end', endGame);
router.patch('/:sessionId/progress', saveGameProgress);
router.post('/:sessionId/catch', addCatch);
router.get('/:sessionId', getGameSession);

module.exports = router;