const express = require('express');
const {
  getUserProfile,
  updateProfile,
  deleteAccount,
  getUserStats,
  getUserGameHistory
} = require('../controllers/userController');

const router = express.Router();

// User profile routes
router.get('/profile', getUserProfile);
router.patch('/profile', updateProfile);
router.delete('/account', deleteAccount);

// User statistics
router.get('/stats', getUserStats);
router.get('/game-history', getUserGameHistory);

module.exports = router;