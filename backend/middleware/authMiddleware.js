const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - check for valid JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookies
    else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'The user belonging to this token no longer exists'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been deactivated. Please contact support.'
        });
      }
      
      // Check if user changed password after the token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          status: 'error',
          message: 'User recently changed password! Please log in again.'
        });
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      
      // Grant access to protected route
      req.user = user;
      next();
      
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error during authentication'
    });
  }
};

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token - just continue without user
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};