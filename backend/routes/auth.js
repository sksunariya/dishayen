const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { protect } = require('../middleware/auth');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Refresh Token (longer expiration)
const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Refresh token lasts 30 days
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (creates pending user until email verified)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists (fully registered)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isBlocked) {
        return res.status(403).json({ 
          message: 'This email is blocked. Please contact support for assistance.',
          code: 'EMAIL_BLOCKED',
          isBlocked: true,
          contactEmail: process.env.ADMIN_EMAIL || 'support@dishayencoaching.com'
        });
      }
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists with this email' });
      } else {
        // Should not happen as unverified users should be in PendingUser
        return res.status(400).json({ message: 'Account exists but not verified. Please check your email.' });
      }
    }

    // Check if pending user exists
    let pendingUser = await PendingUser.findOne({ email });
    
    if (pendingUser) {
      // Check if they can resend verification email
      const canResend = pendingUser.canResendVerificationEmail();
      
      if (!canResend.allowed) {
        return res.status(429).json({ 
          message: canResend.message,
          nextAllowedTime: canResend.nextAllowedTime
        });
      }

      // Update password if changed
      if (password) {
        pendingUser.password = password;
      }
      pendingUser.name = name;
    } else {
      // Create new pending user
      pendingUser = new PendingUser({
        name,
        email,
        password
      });
    }

    // Generate verification token with expiration
    const verificationToken = pendingUser.getVerificationToken();

    // Record email sent
    pendingUser.recordVerificationEmailSent();
    
    // Save pending user with token and expiration
    await pendingUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(pendingUser, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please check your email to verify your account before you can login.',
      email: pendingUser.email,
      remainingAttempts: pendingUser.canResendVerificationEmail().remainingAttempts
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A registration is already pending for this email. Please check your email or wait before trying again.' });
    }
    
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact support for assistance.',
        code: 'ACCOUNT_BLOCKED',
        isBlocked: true,
        contactEmail: process.env.ADMIN_EMAIL || 'support@dishayencoaching.com'
      });
    }

    // Check if user registered with Google OAuth (no password)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account was created with Google. Please sign in with Google.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        isVerified: false,
        userId: user._id
      });
    }

    // Generate token
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        cloudinaryPublicId: user.cloudinaryPublicId,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email and create actual user account
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find pending user with valid token
    const pendingUser = await PendingUser.findOne({ 
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!pendingUser) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token. Please register again or request a new verification email.' 
      });
    }

    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      // Clean up pending user
      await PendingUser.deleteOne({ _id: pendingUser._id });
      
      if (existingUser.isVerified) {
        return res.status(400).json({ 
          message: 'This email is already verified. Please login.' 
        });
      }
    }

    // Create actual user account
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
      role: 'student'
    });

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    // Generate JWT token for auto-login
    const jwtToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account has been created. You can now login.',
      token: jwtToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        cloudinaryPublicId: user.cloudinaryPublicId,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  async (req, res) => {
    try {
      // Check if user is blocked
      if (req.user.isBlocked) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_blocked`);
      }

      // Generate JWT token
      const token = generateToken(req.user._id);
      const refreshToken = generateRefreshToken(req.user._id);

      // Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        cloudinaryPublicId: user.cloudinaryPublicId,
        theme: user.theme,
        purchasedCourses: user.purchasedCourses,
        notifications: user.notifications
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email for pending users
// @access  Public (no auth required for pending users)
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'This email is already verified. Please login.' });
      }
    }

    // Find pending user
    const pendingUser = await PendingUser.findOne({ email });
    
    if (!pendingUser) {
      // Don't reveal if email exists or not for security
      return res.status(404).json({ 
        message: 'No pending registration found for this email. Please register first.' 
      });
    }

    // Check if user can resend email (rate limit)
    const canResend = pendingUser.canResendVerificationEmail();
    
    if (!canResend.allowed) {
      return res.status(429).json({ 
        message: canResend.message,
        nextAllowedTime: canResend.nextAllowedTime
      });
    }

    // Generate new verification token
    const verificationToken = pendingUser.getVerificationToken();
    
    // Record email sent
    pendingUser.recordVerificationEmailSent();
    
    await pendingUser.save();

    // Send verification email
    await sendVerificationEmail(pendingUser, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      remainingAttempts: canResend.remainingAttempts - 1
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email', error: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user registered with Google OAuth (no password to reset)
    if (!user.password && user.googleId) {
      return res.status(400).json({
        message: 'This account was created with Google. Please sign in with Google.'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();

    // Save user with reset token
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user, resetToken);
      
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email address.'
      });
    } catch (emailError) {
      // If email fails, clear reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Password reset email error:', emailError);
      return res.status(500).json({
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/reset-password/:resetToken
// @desc    Verify reset token
// @access  Public
router.get('/reset-password/:resetToken', async (req, res) => {
  try {
    // Hash token to compare with database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/auth/reset-password/:resetToken
// @desc    Reset password
// @access  Public
router.put('/reset-password/:resetToken', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a new password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash token to compare with database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        cloudinaryPublicId: user.cloudinaryPublicId,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        message: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Check if it's actually a refresh token
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ 
          message: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Get user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          avatar: user.avatar,
          cloudinaryPublicId: user.cloudinaryPublicId,
          theme: user.theme
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Refresh token expired, please login again',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

