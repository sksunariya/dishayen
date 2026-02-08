const express = require('express');
const router = express.Router();
const multer = require('multer');
const VideoTestimonial = require('../models/VideoTestimonial');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// Configure multer for video uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

// @route   GET /api/video-testimonials
// @desc    Get all active video testimonials
// @access  Public
router.get('/', async (req, res) => {
  try {
    const videoTestimonials = await VideoTestimonial.find({ isActive: true })
      .populate('user', 'name avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: videoTestimonials.length,
      videoTestimonials
    });
  } catch (error) {
    console.error('Get video testimonials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/video-testimonials/all (Admin)
// @desc    Get all video testimonials including inactive
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const videoTestimonials = await VideoTestimonial.find()
      .populate('user', 'name avatar email')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: videoTestimonials.length,
      videoTestimonials
    });
  } catch (error) {
    console.error('Get all video testimonials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/video-testimonials
// @desc    Create video testimonial (upload or YouTube)
// @access  Private/Admin
router.post('/', protect, admin, upload.single('video'), async (req, res) => {
  try {
    const { title, studentName, course, type, youtubeUrl, duration, order } = req.body;

    if (!title || !studentName || !type) {
      return res.status(400).json({ message: 'Please provide title, student name, and type' });
    }

    const videoData = {
      title,
      studentName,
      course: course || '',
      type,
      duration: duration || '',
      order: order ? parseInt(order) : 0,
      user: req.user.id
    };

    // Handle video upload
    if (type === 'upload') {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a video file' });
      }

      // Upload to Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'video-testimonials',
        resource_type: 'video',
        timeout: 180000 // 3 minutes
      });

      videoData.videoUrl = result.secure_url;
      videoData.cloudinaryPublicId = result.public_id;
      videoData.thumbnail = result.thumbnail_url || null;
    } 
    // Handle YouTube URL
    else if (type === 'youtube') {
      if (!youtubeUrl) {
        return res.status(400).json({ message: 'Please provide YouTube URL' });
      }
      videoData.youtubeUrl = youtubeUrl;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    const videoTestimonial = await VideoTestimonial.create(videoData);
    const populated = await VideoTestimonial.findById(videoTestimonial._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Video testimonial added successfully',
      videoTestimonial: populated
    });
  } catch (error) {
    console.error('Create video testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/video-testimonials/:id
// @desc    Update video testimonial
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, studentName, course, isActive, order, duration } = req.body;

    const videoTestimonial = await VideoTestimonial.findById(req.params.id);

    if (!videoTestimonial) {
      return res.status(404).json({ message: 'Video testimonial not found' });
    }

    if (title !== undefined) videoTestimonial.title = title;
    if (studentName !== undefined) videoTestimonial.studentName = studentName;
    if (course !== undefined) videoTestimonial.course = course;
    if (isActive !== undefined) videoTestimonial.isActive = isActive;
    if (order !== undefined) videoTestimonial.order = parseInt(order);
    if (duration !== undefined) videoTestimonial.duration = duration;

    await videoTestimonial.save();

    const populated = await VideoTestimonial.findById(videoTestimonial._id)
      .populate('user', 'name avatar');

    res.json({
      success: true,
      message: 'Video testimonial updated successfully',
      videoTestimonial: populated
    });
  } catch (error) {
    console.error('Update video testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/video-testimonials/:id
// @desc    Delete video testimonial
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const videoTestimonial = await VideoTestimonial.findById(req.params.id);

    if (!videoTestimonial) {
      return res.status(404).json({ message: 'Video testimonial not found' });
    }

    // Delete video from Cloudinary if it's an uploaded video
    if (videoTestimonial.type === 'upload' && videoTestimonial.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(videoTestimonial.cloudinaryPublicId, {
          resource_type: 'video'
        });
      } catch (err) {
        console.error('Error deleting video from Cloudinary:', err);
      }
    }

    await VideoTestimonial.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete video testimonial error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

