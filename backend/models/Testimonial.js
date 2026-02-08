const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide testimonial content'],
    maxlength: [500, 'Testimonial cannot be more than 500 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'archived'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Populate user info when querying
testimonialSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name avatar email'
  });
  next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);

