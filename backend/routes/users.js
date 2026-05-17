const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToS3, deleteFromS3 } = require('../config/s3');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Configure multer for memory storage
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'purchasedCourses.course',
        select: 'title description image price instructor duration averageRating'
      });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, bio, phone, socialLinks } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar; // Allow empty string to remove avatar
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (socialLinks) user.socialLinks = socialLinks;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        cloudinaryPublicId: user.cloudinaryPublicId,
        bio: user.bio,
        phone: user.phone,
        socialLinks: user.socialLinks,
        theme: user.theme,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload profile picture to S3
// @access  Private
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get user to delete old avatar if it exists
    const user = await User.findById(req.user.id);
    
    // Delete old avatar from S3 if it exists
    if (user.cloudinaryPublicId) {
      try {
        await deleteFromS3(user.cloudinaryPublicId);
      } catch (err) {
        console.error('Error deleting old avatar from S3:', err);
        // Continue even if deletion fails
      }
    }

    // Upload to S3
    const ext = req.file.originalname.split('.').pop();
    const key = `avatars/${Date.now()}.${ext}`;
    const avatarUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);

    // Update user avatar
    user.avatar = avatarUrl;
    user.cloudinaryPublicId = key;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl,
      cloudinaryPublicId: key
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload avatar' });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');

    res.json({
      success: true,
      notifications: user.notifications.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:notificationId/read', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await user.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/notifications/:notificationId
// @desc    Delete a notification
// @access  Private
router.delete('/notifications/:notificationId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.notifications = user.notifications.filter(
      notif => notif._id.toString() !== req.params.notificationId
    );
    
    await user.save();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.notifications.forEach(notification => {
      notification.read = true;
    });
    
    await user.save();

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


