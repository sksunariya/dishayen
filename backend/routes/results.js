const express = require('express');
const router = express.Router();
const multer = require('multer');
const Result = require('../models/Result');
const ResultSettings = require('../models/ResultSettings');
const { protect, admin } = require('../middleware/auth');
const { uploadToS3, deleteFromS3 } = require('../config/s3');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|mov|avi|mkv|webm/;
  const isImage = imageTypes.test(file.originalname.toLowerCase()) && file.mimetype.startsWith('image/');
  const isVideo = videoTypes.test(file.originalname.toLowerCase()) && file.mimetype.startsWith('video/');
  if (isImage || isVideo) return cb(null, true);
  cb(new Error('Only image (jpeg, jpg, png, gif, webp) and video (mp4, mov, avi, mkv, webm) files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB covers both images and videos
  fileFilter
});

const getSettings = async () => {
  let settings = await ResultSettings.findOne();
  if (!settings) settings = await ResultSettings.create({ gridCols: 3 });
  return settings;
};

// @route   GET /api/results
// @desc    Get all active results + grid setting
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [results, settings] = await Promise.all([
      Result.find({ isActive: true }).sort({ order: 1, createdAt: -1 }),
      getSettings()
    ]);
    res.json({ success: true, results, gridCols: settings.gridCols });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/results/all
// @desc    Get all results including inactive + grid setting
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const [results, settings] = await Promise.all([
      Result.find().sort({ order: 1, createdAt: -1 }),
      getSettings()
    ]);
    res.json({ success: true, results, gridCols: settings.gridCols });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/results/settings
// @desc    Update grid column setting
// @access  Private/Admin
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const gridCols = Number(req.body.gridCols);
    if (![2, 3, 4].includes(gridCols)) {
      return res.status(400).json({ message: 'gridCols must be 2, 3, or 4' });
    }
    let settings = await ResultSettings.findOne();
    if (!settings) {
      settings = await ResultSettings.create({ gridCols });
    } else {
      settings.gridCols = gridCols;
      await settings.save();
    }
    res.json({ success: true, gridCols: settings.gridCols });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/results
// @desc    Add a new result (upload or link)
// @access  Private/Admin
router.post('/', protect, admin, upload.single('file'), async (req, res) => {
  try {
    const { title, caption, mediaType, fileType, url, order } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!mediaType) return res.status(400).json({ message: 'mediaType is required' });

    let resultUrl = '';
    let s3Key = '';
    let resolvedFileType = fileType;

    if (mediaType === 'upload') {
      if (!req.file) return res.status(400).json({ message: 'Please upload a file' });
      resolvedFileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const ext = req.file.originalname.split('.').pop();
      s3Key = `results/${Date.now()}.${ext}`;
      resultUrl = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
    } else if (mediaType === 'link') {
      if (!url) return res.status(400).json({ message: 'URL is required for link type' });
      if (!fileType) return res.status(400).json({ message: 'fileType is required for link type' });
      resultUrl = url;
    } else {
      return res.status(400).json({ message: 'Invalid mediaType' });
    }

    const result = await Result.create({
      title,
      caption: caption || '',
      mediaType,
      fileType: resolvedFileType,
      url: resultUrl,
      s3Key,
      order: order ? parseInt(order) : 0
    });

    res.status(201).json({ success: true, message: 'Result added successfully', result });
  } catch (error) {
    console.error('Add result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/results/:id
// @desc    Update a result
// @access  Private/Admin
router.put('/:id', protect, admin, upload.single('file'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    const { title, caption, order, isActive, url } = req.body;

    if (req.file) {
      // Replace the uploaded file on S3
      if (result.s3Key) {
        try { await deleteFromS3(result.s3Key); } catch (e) {}
      }
      const ext = req.file.originalname.split('.').pop();
      result.s3Key = `results/${Date.now()}.${ext}`;
      result.url = await uploadToS3(req.file.buffer, result.s3Key, req.file.mimetype);
      result.fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    } else if (result.mediaType === 'link' && url) {
      result.url = url;
    }

    if (title !== undefined) result.title = title;
    if (caption !== undefined) result.caption = caption;
    if (order !== undefined) result.order = parseInt(order);
    if (isActive !== undefined) result.isActive = isActive === 'true' || isActive === true;

    await result.save();
    res.json({ success: true, message: 'Result updated successfully', result });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete a result and remove from S3 if uploaded
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    if (result.s3Key) {
      try { await deleteFromS3(result.s3Key); } catch (e) {}
    }

    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
