const express = require('express');
const { body } = require('express-validator');
const {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Please provide a password'),
];

const passwordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

// Authentication routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// Password reset routes
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], forgotPassword);

router.patch('/reset-password/:token', passwordValidation, resetPassword);

// Protected routes
router.patch('/update-password', protect, [
  body('passwordCurrent').notEmpty().withMessage('Please provide your current password'),
  ...passwordValidation
], updatePassword);

module.exports = router;