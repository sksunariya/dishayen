const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  verificationEmailsSent: [{
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Store any additional registration data
  registrationData: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Hash password before saving
pendingUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate email verification token
pendingUserSchema.methods.getVerificationToken = function() {
  const crypto = require('crypto');
  
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Store token directly (not hashed for email verification)
  this.verificationToken = verificationToken;
  
  // Set expire (24 hours)
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Check if user can resend verification email (max 5 in 24 hours)
pendingUserSchema.methods.canResendVerificationEmail = function() {
  if (!this.verificationEmailsSent || this.verificationEmailsSent.length === 0) {
    return { allowed: true, remainingAttempts: 5 };
  }
  
  // Filter emails sent in last 24 hours
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentEmails = this.verificationEmailsSent.filter(
    email => email.sentAt.getTime() > twentyFourHoursAgo
  );
  
  const remainingAttempts = Math.max(0, 5 - recentEmails.length);
  
  if (recentEmails.length >= 5) {
    // Find when the oldest email will expire (24 hours from when it was sent)
    const oldestEmail = recentEmails.sort((a, b) => a.sentAt - b.sentAt)[0];
    const nextAllowedTime = new Date(oldestEmail.sentAt.getTime() + 24 * 60 * 60 * 1000);
    
    return { 
      allowed: false, 
      remainingAttempts: 0,
      nextAllowedTime,
      message: `You've reached the maximum of 5 verification emails in 24 hours. Please try again after ${nextAllowedTime.toLocaleString()}`
    };
  }
  
  return { allowed: true, remainingAttempts };
};

// Record verification email sent
pendingUserSchema.methods.recordVerificationEmailSent = function() {
  if (!this.verificationEmailsSent) {
    this.verificationEmailsSent = [];
  }
  
  // Clean up old entries (older than 24 hours)
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  this.verificationEmailsSent = this.verificationEmailsSent.filter(
    email => email.sentAt.getTime() > twentyFourHoursAgo
  );
  
  // Add new entry
  this.verificationEmailsSent.push({ sentAt: new Date() });
};

// Static method to clean up expired pending users (older than 7 days)
pendingUserSchema.statics.cleanupExpired = async function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({ createdAt: { $lt: sevenDaysAgo } });
  return result.deletedCount;
};

module.exports = mongoose.model('PendingUser', pendingUserSchema);

