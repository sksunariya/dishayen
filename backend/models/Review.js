const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a review comment'],
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  helpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews (one user can only review a course once)
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

// Populate user info
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name avatar'
  });
  next();
});

// Update course average rating after save
reviewSchema.post('save', async function() {
  await this.constructor.updateCourseRating(this.course);
});

// Update course average rating after remove
reviewSchema.post('remove', async function() {
  await this.constructor.updateCourseRating(this.course);
});

// Static method to update course rating
reviewSchema.statics.updateCourseRating = async function(courseId) {
  const Course = mongoose.model('Course');
  const course = await Course.findById(courseId);
  if (course) {
    await course.calculateAverageRating();
  }
};

module.exports = mongoose.model('Review', reviewSchema);

