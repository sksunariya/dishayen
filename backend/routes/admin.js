const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const ContactQuery = require('../models/ContactQuery');
const { protect, admin } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/emailService');
const cloudinary = require('../config/cloudinary');

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// All routes are protected and admin-only

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats', protect, admin, async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingTestimonials = await Testimonial.countDocuments({ status: 'pending' });

    // Get revenue
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const totalTransactions = revenueData.length > 0 ? revenueData[0].totalTransactions : 0;

    // Get recent enrollments
    const recentEnrollments = await Payment.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('course', 'title');

    // Get popular courses
    const popularCourses = await Course.find()
      .sort({ enrolledStudents: -1 })
      .limit(5)
      .select('title enrolledStudents averageRating image');

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalStudents,
        totalRevenue,
        totalTransactions,
        pendingTestimonials
      },
      recentEnrollments,
      popularCourses,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// COURSE MANAGEMENT

// @route   GET /api/admin/courses/all
// @desc    Get all courses including archived
// @access  Private/Admin
router.get('/courses/all', protect, admin, async (req, res) => {
  try {
    const { archived } = req.query;
    
    let query = {};
    if (archived === 'true') {
      query.archived = true;
    } else if (archived === 'false') {
      // Get non-archived courses (including those without archived field)
      query.$or = [{ archived: false }, { archived: { $exists: false } }];
    }

    const courses = await Course.find(query)
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/courses
// @desc    Create a new course with optional thumbnail upload
// @access  Private/Admin
router.post('/courses', protect, admin, upload.single('thumbnail'), async (req, res) => {
  try {
    const courseData = { ...req.body };

    // Parse array fields from FormData (they come as requirements[0], requirements[1], etc.)
    const requirements = [];
    const whatYouWillLearn = [];
    
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('requirements[')) {
        requirements.push(req.body[key]);
      } else if (key.startsWith('whatYouWillLearn[')) {
        whatYouWillLearn.push(req.body[key]);
      }
    });

    if (requirements.length > 0) {
      courseData.requirements = requirements;
    }
    if (whatYouWillLearn.length > 0) {
      courseData.whatYouWillLearn = whatYouWillLearn;
    }

    // Clean up the requirements[n] and whatYouWillLearn[n] keys
    Object.keys(courseData).forEach(key => {
      if (key.startsWith('requirements[') || key.startsWith('whatYouWillLearn[')) {
        delete courseData[key];
      }
    });

    // Handle thumbnail upload to Cloudinary if provided
    if (req.file) {
      try {
        console.log('Starting Cloudinary upload for course thumbnail...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'course-thumbnails',
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:low', fetch_format: 'auto' }
          ],
          timeout: 120000 // 2 minutes timeout for upload
        });

        console.log('Cloudinary upload successful:', result.public_id);
        courseData.image = result.secure_url;
        courseData.cloudinaryPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload image to cloud storage',
          error: uploadError.message 
        });
      }
    }

    const course = await Course.create(courseData);

    // Send response immediately
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });

    // Notify all users about new course asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const users = await User.find({ role: 'student' });
        const userUpdates = users.map(user => {
          user.notifications.push({
            type: 'new_course',
            message: `New course available: "${course.title}"`,
            read: false
          });
          return user.save();
        });
        await Promise.all(userUpdates);
      } catch (notifyError) {
        console.error('Error sending course notifications:', notifyError);
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update a course with optional thumbnail upload
// @access  Private/Admin
router.put('/courses/:id', protect, admin, upload.single('thumbnail'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Parse array fields from FormData (they come as requirements[0], requirements[1], etc.)
    const requirements = [];
    const whatYouWillLearn = [];
    
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('requirements[')) {
        requirements.push(req.body[key]);
      } else if (key.startsWith('whatYouWillLearn[')) {
        whatYouWillLearn.push(req.body[key]);
      }
    });

    if (requirements.length > 0) {
      req.body.requirements = requirements;
    }
    if (whatYouWillLearn.length > 0) {
      req.body.whatYouWillLearn = whatYouWillLearn;
    }

    // Clean up the requirements[n] and whatYouWillLearn[n] keys
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('requirements[') || key.startsWith('whatYouWillLearn[')) {
        delete req.body[key];
      }
    });

    // Handle thumbnail upload to Cloudinary if provided
    if (req.file) {
      try {
        console.log('Starting Cloudinary upload for course thumbnail update...');
        
        // Delete old image from Cloudinary if it exists
        if (course.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(course.cloudinaryPublicId);
            console.log('Old thumbnail deleted from Cloudinary');
          } catch (err) {
            console.error('Error deleting old course thumbnail from Cloudinary:', err);
          }
        }

        // Upload new image
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'course-thumbnails',
          resource_type: 'auto',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:low', fetch_format: 'auto' }
          ],
          timeout: 120000 // 2 minutes timeout for upload
        });

        console.log('Cloudinary upload successful:', result.public_id);
        req.body.image = result.secure_url;
        req.body.cloudinaryPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload image to cloud storage',
          error: uploadError.message 
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PATCH /api/admin/courses/:id/archive
// @desc    Archive a course
// @access  Private/Admin
router.patch('/courses/:id/archive', protect, admin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        archived: true,
        archivedAt: new Date(),
        isActive: false
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course archived successfully',
      course
    });
  } catch (error) {
    console.error('Archive course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/courses/:id/restore
// @desc    Restore an archived course
// @access  Private/Admin
router.patch('/courses/:id/restore', protect, admin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { 
        archived: false,
        archivedAt: null,
        isActive: true
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course restored successfully',
      course
    });
  } catch (error) {
    console.error('Restore course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete a course
// @access  Private/Admin
router.delete('/courses/:id', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Delete thumbnail from Cloudinary if it exists
    if (course.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(course.cloudinaryPublicId);
        console.log('Course thumbnail deleted from Cloudinary');
      } catch (err) {
        console.error('Error deleting course thumbnail from Cloudinary:', err);
        // Continue with course deletion even if Cloudinary deletion fails
      }
    }

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    // Delete all reviews for this course
    await Review.deleteMany({ course: req.params.id });

    res.json({
      success: true,
      message: 'Course and associated reviews deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// TESTIMONIAL MANAGEMENT

// @route   GET /api/admin/testimonials
// @desc    Get all testimonials (including pending)
// @access  Private/Admin
router.get('/testimonials', protect, admin, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const testimonials = await Testimonial.find(query)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: testimonials.length,
      testimonials
    });
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/testimonials/:id/approve
// @desc    Approve a testimonial
// @access  Private/Admin
router.put('/testimonials/:id/approve', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    testimonial.status = 'approved';
    await testimonial.save();

    // Notify user
    const user = await User.findById(testimonial.user._id);
    if (user) {
      user.notifications.push({
        type: 'testimonial_approved',
        message: 'Your testimonial has been approved and is now visible on the homepage!',
        read: false
      });
      await user.save();
    }

    res.json({
      success: true,
      message: 'Testimonial approved successfully',
      testimonial
    });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/testimonials/:id/reject
// @desc    Reject a testimonial
// @access  Private/Admin
router.put('/testimonials/:id/reject', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    testimonial.status = 'rejected';
    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial rejected',
      testimonial
    });
  } catch (error) {
    console.error('Reject testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/testimonials/:id/archive
// @desc    Archive a testimonial
// @access  Private/Admin
router.put('/testimonials/:id/archive', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    testimonial.status = 'archived';
    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial archived successfully',
      testimonial
    });
  } catch (error) {
    console.error('Archive testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/testimonials/:id/restore
// @desc    Restore an archived testimonial
// @access  Private/Admin
router.put('/testimonials/:id/restore', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // Restore to pending status
    testimonial.status = 'pending';
    await testimonial.save();

    res.json({
      success: true,
      message: 'Testimonial restored successfully',
      testimonial
    });
  } catch (error) {
    console.error('Restore testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/testimonials/:id
// @desc    Delete a testimonial
// @access  Private/Admin
router.delete('/testimonials/:id', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// USER MANAGEMENT

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    let query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('purchasedCourses.course');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's payments
    const payments = await Payment.find({ user: req.params.id })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      payments
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/users/:id/block
// @desc    Block a user
// @access  Private/Admin
router.patch('/users/:id/block', protect, admin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot block admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot block admin users' });
    }

    // Check if already blocked
    if (user.isBlocked) {
      return res.status(400).json({ message: 'User is already blocked' });
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedBy = req.user.id;
    user.blockReason = reason || 'No reason provided';
    
    await user.save();

    res.json({
      success: true,
      message: 'User blocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt,
        blockReason: user.blockReason
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/users/:id/unblock
// @desc    Unblock a user
// @access  Private/Admin
router.patch('/users/:id/unblock', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is blocked
    if (!user.isBlocked) {
      return res.status(400).json({ message: 'User is not blocked' });
    }

    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedBy = null;
    user.blockReason = null;
    
    await user.save();

    res.json({
      success: true,
      message: 'User unblocked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (kept for backend use, not exposed in UI)
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot delete admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await user.deleteOne();

    // Clean up user's testimonials and reviews
    await Testimonial.deleteMany({ user: req.params.id });
    await Review.deleteMany({ user: req.params.id });

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Private/Admin
router.get('/payments', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments();

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CONTACT QUERY MANAGEMENT

// @route   GET /api/admin/queries
// @desc    Get all contact queries with filters
// @access  Private/Admin
router.get('/queries', protect, admin, async (req, res) => {
  try {
    const { 
      status, 
      priority,
      search,
      sortBy = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const queries = await ContactQuery.find(query)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ContactQuery.countDocuments(query);

    // Get status counts for dashboard
    const statusCounts = await ContactQuery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      queries,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/queries/:id
// @desc    Get single query by ID
// @access  Private/Admin
router.get('/queries/:id', protect, admin, async (req, res) => {
  try {
    const query = await ContactQuery.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('resolvedBy', 'name email avatar');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json({
      success: true,
      query
    });
  } catch (error) {
    console.error('Get query error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/queries/:id/status
// @desc    Update query status
// @access  Private/Admin
router.patch('/queries/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const query = await ContactQuery.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    query.status = status;

    // If marking as resolved, set resolved fields
    if (status === 'Resolved' && query.status !== 'Resolved') {
      query.resolvedAt = new Date();
      query.resolvedBy = req.user.id;
    }

    await query.save();

    res.json({
      success: true,
      message: 'Query status updated successfully',
      query
    });
  } catch (error) {
    console.error('Update query status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/admin/queries/:id
// @desc    Update query details (notes, priority, assignment, response)
// @access  Private/Admin
router.patch('/queries/:id', protect, admin, async (req, res) => {
  try {
    const { adminNotes, priority, assignedTo, responseMessage, tags } = req.body;

    const query = await ContactQuery.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    if (adminNotes !== undefined) query.adminNotes = adminNotes;
    if (priority !== undefined) query.priority = priority;
    if (assignedTo !== undefined) query.assignedTo = assignedTo || null;
    if (responseMessage !== undefined) query.responseMessage = responseMessage;
    if (tags !== undefined) query.tags = tags;

    await query.save();

    const updatedQuery = await ContactQuery.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    res.json({
      success: true,
      message: 'Query updated successfully',
      query: updatedQuery
    });
  } catch (error) {
    console.error('Update query error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/queries/:id/respond
// @desc    Send email response to user
// @access  Private/Admin
router.post('/queries/:id/respond', protect, admin, async (req, res) => {
  try {
    const { responseMessage } = req.body;

    if (!responseMessage) {
      return res.status(400).json({ message: 'Please provide a response message' });
    }

    const query = await ContactQuery.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Save response to database
    query.responseMessage = responseMessage;
    query.status = 'Resolved';
    query.resolvedAt = new Date();
    query.resolvedBy = req.user.id;
    await query.save();

    // Send email to user
    const emailContent = `
      <h2>Response to Your Inquiry</h2>
      <p>Hi ${query.firstName},</p>
      <p>Thank you for contacting us. Here's our response to your message:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
        <strong>Your Message:</strong>
        <p>${query.message.replace(/\n/g, '<br>')}</p>
      </div>
      <div style="background-color: #e8f4f8; padding: 20px; border-left: 4px solid #764ba2; margin: 20px 0;">
        <strong>Our Response:</strong>
        <p>${responseMessage.replace(/\n/g, '<br>')}</p>
      </div>
      <p>If you have any further questions, please don't hesitate to reach out.</p>
      <br>
      <p>Best regards,<br>Dishayen Coaching Team</p>
    `;

    try {
      await sendNotificationEmail(
        { email: query.email, name: query.firstName },
        'Response to Your Inquiry - Dishayen Coaching',
        emailContent
      );
    } catch (emailError) {
      console.error('Error sending response email:', emailError);
      return res.status(500).json({ 
        message: 'Query updated but failed to send email',
        error: emailError.message 
      });
    }

    res.json({
      success: true,
      message: 'Response sent successfully',
      query
    });
  } catch (error) {
    console.error('Send response error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/queries/:id
// @desc    Delete a query
// @access  Private/Admin
router.delete('/queries/:id', protect, admin, async (req, res) => {
  try {
    const query = await ContactQuery.findByIdAndDelete(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json({
      success: true,
      message: 'Query deleted successfully'
    });
  } catch (error) {
    console.error('Delete query error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

