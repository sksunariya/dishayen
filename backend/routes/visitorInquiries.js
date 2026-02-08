const express = require('express');
const router = express.Router();
const VisitorInquiry = require('../models/VisitorInquiry');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/visitor-inquiries
// @desc    Create new visitor inquiry (public)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, className, examPreparingFor, mobileNumber } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please provide your name' });
    }
    if (!className || !className.trim()) {
      return res.status(400).json({ message: 'Please provide your class' });
    }
    if (!examPreparingFor || !examPreparingFor.trim()) {
      return res.status(400).json({ message: 'Please provide the exam you are preparing for' });
    }
    if (!mobileNumber || !mobileNumber.trim()) {
      return res.status(400).json({ message: 'Please provide your mobile number' });
    }

    // Validate mobile number format (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    const inquiry = await VisitorInquiry.create({
      name: name.trim(),
      className: className.trim(),
      examPreparingFor: examPreparingFor.trim(),
      mobileNumber: mobileNumber.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We will contact you soon.',
      inquiry
    });
  } catch (error) {
    console.error('Create visitor inquiry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/visitor-inquiries
// @desc    Get all visitor inquiries (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const inquiries = await VisitorInquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VisitorInquiry.countDocuments(query);

    res.json({
      success: true,
      count: inquiries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      inquiries
    });
  } catch (error) {
    console.error('Get visitor inquiries error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/visitor-inquiries/stats
// @desc    Get statistics for visitor inquiries (Admin only)
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const total = await VisitorInquiry.countDocuments();
    const unattended = await VisitorInquiry.countDocuments({ status: 'unattended' });
    const acknowledged = await VisitorInquiry.countDocuments({ status: 'acknowledged' });
    const contacted = await VisitorInquiry.countDocuments({ status: 'contacted' });
    const completed = await VisitorInquiry.countDocuments({ status: 'completed' });
    const rejected = await VisitorInquiry.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      stats: {
        total,
        unattended,
        acknowledged,
        contacted,
        completed,
        rejected
      }
    });
  } catch (error) {
    console.error('Get visitor inquiry stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/visitor-inquiries/:id
// @desc    Get single visitor inquiry (Admin only)
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const inquiry = await VisitorInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Visitor inquiry not found' });
    }

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    console.error('Get visitor inquiry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/visitor-inquiries/:id
// @desc    Update visitor inquiry status and notes (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const inquiry = await VisitorInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Visitor inquiry not found' });
    }

    if (status) {
      const validStatuses = ['unattended', 'acknowledged', 'contacted', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      inquiry.status = status;
    }

    if (notes !== undefined) {
      inquiry.notes = notes.trim();
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Visitor inquiry updated successfully',
      inquiry
    });
  } catch (error) {
    console.error('Update visitor inquiry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/visitor-inquiries/:id
// @desc    Delete visitor inquiry (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const inquiry = await VisitorInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Visitor inquiry not found' });
    }

    await VisitorInquiry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Visitor inquiry deleted successfully'
    });
  } catch (error) {
    console.error('Delete visitor inquiry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

