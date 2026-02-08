const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date,
    default: null
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  blockReason: {
    type: String,
    default: null
  },
  googleId: String,
  avatar: {
    type: String,
    default: null
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  phone: String,
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  purchasedCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    amount: Number,
    paymentId: String
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['course_purchase', 'testimonial_approved', 'new_course', 'general']
    },
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  // Only hash if password exists (for Google OAuth users)
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has purchased a course
userSchema.methods.hasPurchasedCourse = function(courseId) {
  return this.purchasedCourses.some(
    purchase => purchase.course.toString() === courseId.toString()
  );
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);

