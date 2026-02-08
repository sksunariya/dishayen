const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay'],
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Populate course and user info
paymentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  }).populate({
    path: 'course',
    select: 'title price image'
  });
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

