const express = require('express');
const {
  getGlobalLeaderboard,
  getGameModeLeaderboard,
  getUserRank
} = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Leaderboard routes
router.get('/global', optionalAuth, getGlobalLeaderboard);
router.get('/gamemode/:mode', optionalAuth, getGameModeLeaderboard);
router.get('/user/:userId/rank', getUserRank);

module.exports = router;