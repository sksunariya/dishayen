const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Course = require('../models/Course');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all active categories (excluding system categories like "Other")
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      isSystemCategory: false 
    }).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/categories/featured
// @desc    Get featured categories
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isFeatured: true,
      isActive: true,
      isSystemCategory: false 
    }).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/categories/all (Admin)
// @desc    Get all categories including system categories
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, icon, isFeatured, order } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a category name' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name,
      description: description || '',
      icon: icon || '',
      isFeatured: isFeatured || false,
      order: order || 0,
      isSystemCategory: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, icon, isFeatured, order, isActive } = req.body;

    // System categories restrictions
    if (category.isSystemCategory) {
      // System categories cannot be featured
      if (isFeatured === true) {
        return res.status(400).json({ message: 'System categories cannot be featured' });
      }
      // System categories name cannot be changed
      if (name && name !== category.name) {
        return res.status(400).json({ message: 'System category name cannot be changed' });
      }
    }

    // Check for duplicate name (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isFeatured !== undefined && !category.isSystemCategory) category.isFeatured = isFeatured;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (reassign courses to "Other")
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Prevent deletion of system categories
    if (category.isSystemCategory) {
      return res.status(400).json({ message: 'System categories cannot be deleted' });
    }

    // Find the "Other" category
    const otherCategory = await Category.findOne({ isSystemCategory: true, name: 'Other' });
    
    if (!otherCategory) {
      return res.status(500).json({ message: 'System category "Other" not found' });
    }

    // Reassign all courses from this category to "Other"
    const updateResult = await Course.updateMany(
      { category: req.params.id },
      { $set: { category: otherCategory._id } }
    );

    // Delete the category
    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Category deleted successfully. ${updateResult.modifiedCount} courses reassigned to "Other" category.`,
      reassignedCourses: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

