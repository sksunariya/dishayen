const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const User = require('../models/User');
const Course = require('../models/Course');
const Testimonial = require('../models/Testimonial');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const ContactQuery = require('../models/ContactQuery');
const { protect, admin } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/emailService');

// All routes are protected and admin-only

// Fetch Open Graph title and image from a URL
function fetchPageMetadata(urlStr) {
  return new Promise((resolve, reject) => {
    const makeRequest = (currentUrl, redirectCount) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));

      let parsedUrl;
      try { parsedUrl = new URL(currentUrl); } catch (e) { return reject(new Error('Invalid URL')); }

      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 15000
      };

      const req = protocol.request(options, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const loc = res.headers.location;
          const redirectUrl = loc.startsWith('http') ? loc : `${parsedUrl.protocol}//${parsedUrl.hostname}${loc}`;
          res.resume();
          return makeRequest(redirectUrl, redirectCount + 1);
        }

        let html = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          html += chunk;
          if (html.length > 100000) res.destroy();
        });
        res.on('end', () => {
          let title = '';
          const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*?)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']og:title["']/i);
          if (ogTitle) {
            title = ogTitle[1].trim();
          } else {
            const tagTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (tagTitle) title = tagTitle[1].trim();
          }

          let image = '';
          const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*?)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']og:image["']/i);
          if (ogImage) image = ogImage[1].trim();

          resolve({ title, image });
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
      req.end();
    };

    makeRequest(urlStr, 0);
  });
}

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

// @route   POST /api/admin/courses/fetch-metadata
// @desc    Fetch og:title and og:image from a third-party course URL
// @access  Private/Admin
router.post('/courses/fetch-metadata', protect, admin, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const metadata = await fetchPageMetadata(url);
    res.json({ success: true, ...metadata });
  } catch (error) {
    console.error('Fetch metadata error:', error);
    res.status(500).json({ message: 'Failed to fetch metadata from URL', error: error.message });
  }
});

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
// @desc    Create a new course from a third-party URL
// @access  Private/Admin
router.post('/courses', protect, admin, async (req, res) => {
  try {
    const { url, title, image, category, featured } = req.body;

    if (!url) return res.status(400).json({ message: 'Course URL is required' });
    if (!title) return res.status(400).json({ message: 'Course title is required' });

    const courseData = {
      url,
      title,
      image: image || 'https://via.placeholder.com/800x600?text=Course+Thumbnail',
      featured: featured || false
    };
    if (category) courseData.category = category;

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/courses/:id', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { url, title, image, category, featured } = req.body;
    const updates = {};
    if (url !== undefined) updates.url = url;
    if (title !== undefined) updates.title = title;
    if (image !== undefined) updates.image = image;
    if (featured !== undefined) updates.featured = featured;
    updates.category = category || null;

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await Review.deleteMany({ course: req.params.id });

    res.json({ success: true, message: 'Course deleted successfully' });
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

