const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorMiddleware');

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = user.generateAuthToken();
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Helper function to check validation errors
const checkValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = catchAsync(async (req, res, next) => {
  checkValidationErrors(req);
  
  const { name, username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    return next(new AppError(`User with this ${field} already exists`, 400));
  }

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password
  });

  createSendToken(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  checkValidationErrors(req);
  
  const { email, password } = req.body;

  // Check for user and include password in query
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  createSendToken(user, 200, res);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ 
    status: 'success',
    message: 'Logged out successfully'
  });
};

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password changed recently. Please log in again.', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  checkValidationErrors(req);
  
  const { email } = req.body;

  // Get user based on posted email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate random reset token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  user.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // TODO: Send reset token via email
  // For now, just return it (remove in production!)
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
    resetToken // Remove this in production!
  });
});

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  checkValidationErrors(req);
  
  // Get user based on the token
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // If token has not expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in, send JWT
  createSendToken(user, 200, res);
});

// @desc    Update password for logged in user
// @route   PATCH /api/auth/update-password
// @access  Private
const updatePassword = catchAsync(async (req, res, next) => {
  checkValidationErrors(req);
  
  // Get user from collection (with password)
  const user = await User.findById(req.user.id).select('+password');

  // Check if posted current password is correct
  if (!(await user.comparePassword(req.body.passwordCurrent))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // If so, update password
  user.password = req.body.password;
  await user.save();

  // Log user in, send JWT
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword
};