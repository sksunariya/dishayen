const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, verified } = require('../middleware/auth');

// @route   GET /api/reviews/course/:courseId
// @desc    Get all reviews for a course
// @access  Public
router.get('/course/:courseId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ course: req.params.courseId })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ course: req.params.courseId });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/reviews/:courseId
// @desc    Add a review for a course
// @access  Private (must have purchased the course)
router.post('/:courseId', protect, verified, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const courseId = req.params.courseId;

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide rating and comment' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has purchased the course
    const user = await User.findById(req.user.id);
    if (!user.hasPurchasedCourse(courseId)) {
      return res.status(403).json({ 
        message: 'You must purchase this course before leaving a review' 
      });
    }

    // Check if user already reviewed this course
    const existingReview = await Review.findOne({
      course: courseId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this course. You can edit your existing review.' 
      });
    }

    // Create review
    const review = await Review.create({
      course: courseId,
      user: req.user.id,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private (owner only)
router.put('/:reviewId', protect, async (req, res) => {
  try {
    let review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    if (review.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const { rating, comment } = req.body;

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    // Recalculate course rating
    await Review.updateCourseRating(review.course);

    const updatedReview = await Review.findById(review._id);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private (owner only)
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    if (review.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const courseId = review.course;
    await review.deleteOne();

    // Recalculate course rating
    await Review.updateCourseRating(courseId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId/helpful
// @desc    Mark review as helpful
// @access  Private
router.put('/:reviewId/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

