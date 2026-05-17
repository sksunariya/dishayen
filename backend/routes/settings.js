const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get public settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find({});
    
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/:key
// @desc    Get a specific setting by key
// @access  Public
router.get('/:key', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });

    res.json({
      success: true,
      value: setting ? setting.value : null
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update or create a setting (Admin only)
// @access  Private/Admin
router.put('/:key', protect, admin, async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ message: 'Please provide a value' });
    }

    let setting = await Settings.findOne({ key: req.params.key });

    if (setting) {
      setting.value = value;
      setting.updatedBy = req.user.id;
      await setting.save();
    } else {
      setting = await Settings.create({
        key: req.params.key,
        value,
        updatedBy: req.user.id
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

