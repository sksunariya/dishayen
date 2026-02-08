const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses (with optional filters)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      level, 
      search, 
      sort = '-createdAt', 
      page = 1, 
      limit = 12,
      featured 
    } = req.query;

    // Build query - exclude archived courses (including legacy courses without archived field)
    let query = { 
      isActive: true, 
      $or: [{ archived: false }, { archived: { $exists: false } }]
    };

    if (category) query.category = category;
    if (level) query.level = level;
    if (featured) query.featured = featured === 'true';
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('category', 'name icon')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const count = await Course.countDocuments(query);

    // If user is logged in, mark purchased courses
    const coursesWithPurchaseStatus = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.isPurchased = req.user ? req.user.hasPurchasedCourse(course._id) : false;
      return courseObj;
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      courses: coursesWithPurchaseStatus
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('category', 'name icon')
      .populate({
        path: 'reviews',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseObj = course.toObject();
    courseObj.isPurchased = req.user ? req.user.hasPurchasedCourse(course._id) : false;

    res.json({
      success: true,
      course: courseObj
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/courses/categories/all
// @desc    Get all course categories
// @access  Public
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Course.distinct('category');
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/courses/user/purchased
// @desc    Get user's purchased courses
// @access  Private
router.get('/user/purchased', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'purchasedCourses.course',
      select: 'title description image price instructor duration averageRating'
    });

    res.json({
      success: true,
      purchasedCourses: user.purchasedCourses
    });
  } catch (error) {
    console.error('Get purchased courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

