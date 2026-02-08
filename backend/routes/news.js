const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/news
// @desc    Get all active news items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const news = await News.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .limit(10); // Limit to 10 most recent news items

    res.json({
      success: true,
      count: news.length,
      news
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/news/all
// @desc    Get all news items including inactive (Admin only)
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const news = await News.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      count: news.length,
      news
    });
  } catch (error) {
    console.error('Get all news error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/news
// @desc    Create new news item (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, link, description, order, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Please provide a news title' });
    }

    const news = await News.create({
      title: title.trim(),
      link: link && link.trim() ? link.trim() : null,
      description: description ? description.trim() : '',
      order: order ? parseInt(order) : 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'News item created successfully',
      news
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/news/:id
// @desc    Update news item (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, link, description, order, isActive } = req.body;

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News item not found' });
    }

    // Update fields
    if (title !== undefined) news.title = title.trim();
    if (link !== undefined) news.link = link && link.trim() ? link.trim() : null;
    if (description !== undefined) news.description = description ? description.trim() : '';
    if (order !== undefined) news.order = parseInt(order);
    if (isActive !== undefined) news.isActive = isActive;

    await news.save();

    res.json({
      success: true,
      message: 'News item updated successfully',
      news
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/news/:id
// @desc    Delete news item (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News item not found' });
    }

    await News.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'News item deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

