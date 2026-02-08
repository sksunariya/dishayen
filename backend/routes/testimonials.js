const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, verified } = require('../middleware/auth');

// @route   GET /api/testimonials
// @desc    Get all approved testimonials
// @access  Public
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ 
      status: 'approved',
      isActive: true 
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    // Filter out testimonials with null/deleted users
    const validTestimonials = testimonials.filter(t => t.user);

    res.json({
      success: true,
      count: validTestimonials.length,
      testimonials: validTestimonials
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/testimonials
// @desc    Create a new testimonial
// @access  Private (verified users only)
router.post('/', protect, verified, async (req, res) => {
  try {
    const { content, rating, image } = req.body;

    // Validation
    if (!content || !rating) {
      return res.status(400).json({ message: 'Please provide content and rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user already has a pending or approved testimonial
    const existingTestimonial = await Testimonial.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingTestimonial) {
      return res.status(400).json({ 
        message: 'You already have a testimonial. Please wait for admin approval or edit your existing one.' 
      });
    }

    const testimonial = await Testimonial.create({
      user: req.user.id,
      content,
      rating,
      image: image || null,
      status: 'pending'
    });

    const populatedTestimonial = await Testimonial.findById(testimonial._id);

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted successfully. It will be visible after admin approval.',
      testimonial: populatedTestimonial
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/testimonials/my-testimonials
// @desc    Get current user's testimonials
// @access  Private
router.get('/my-testimonials', protect, async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: testimonials.length,
      testimonials
    });
  } catch (error) {
    console.error('Get user testimonials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/testimonials/:id
// @desc    Update a testimonial
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // Check ownership
    if (testimonial.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this testimonial' });
    }

    const { content, rating, image } = req.body;

    testimonial.content = content || testimonial.content;
    testimonial.rating = rating || testimonial.rating;
    testimonial.image = image !== undefined ? image : testimonial.image;
    testimonial.status = 'pending'; // Reset to pending after edit

    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // Check ownership
    if (testimonial.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this testimonial' });
    }

    await testimonial.deleteOne();

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

