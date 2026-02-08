const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized to access this route',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired, please login again',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      return res.status(401).json({ 
        message: 'Not authorized, token failed',
        code: 'TOKEN_FAILED'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error in authentication',
      code: 'AUTH_ERROR'
    });
  }
};

// Check if user is admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Check if user is verified
exports.verified = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    next();
  } else {
    res.status(403).json({ message: 'Please verify your email to access this resource' });
  }
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

