const express = require('express');
const router = express.Router();
const multer = require('multer');
const CarouselImage = require('../models/CarouselImage');
const { protect, admin } = require('../middleware/auth');
const { uploadToS3, deleteFromS3 } = require('../config/s3');

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

// @route   GET /api/carousel
// @desc    Get all active carousel images
// @access  Public
router.get('/', async (req, res) => {
  try {
    const images = await CarouselImage.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Get carousel images error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/carousel
// @desc    Add new carousel image with S3 upload (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, linkUrl, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please provide a title' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Upload image to S3
    const ext = req.file.originalname.split('.').pop();
    const key = `carousel/${Date.now()}.${ext}`;
    const imageUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);

    const image = await CarouselImage.create({
      title,
      imageUrl,
      cloudinaryPublicId: key,
      description: description || '',
      linkUrl: linkUrl || '',
      order: order ? parseInt(order) : 0
    });

    res.status(201).json({
      success: true,
      message: 'Carousel image added successfully',
      image
    });
  } catch (error) {
    console.error('Add carousel image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/carousel/all
// @desc    Get all carousel images including inactive (Admin only)
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const images = await CarouselImage.find()
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Get all carousel images error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/carousel/:id
// @desc    Update carousel image with optional S3 upload (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, linkUrl, order, isActive } = req.body;
    
    const image = await CarouselImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Carousel image not found' });
    }

    // If new image is uploaded, replace on S3
    if (req.file) {
      // Delete old image from S3 if it exists
      if (image.cloudinaryPublicId) {
        try {
          await deleteFromS3(image.cloudinaryPublicId);
        } catch (err) {
          console.error('Error deleting old carousel image from S3:', err);
        }
      }

      // Upload new image to S3
      const ext = req.file.originalname.split('.').pop();
      const key = `carousel/${Date.now()}.${ext}`;
      image.imageUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);
      image.cloudinaryPublicId = key;
    }

    // Update other fields
    if (title !== undefined) image.title = title;
    if (description !== undefined) image.description = description;
    if (linkUrl !== undefined) image.linkUrl = linkUrl;
    if (order !== undefined) image.order = parseInt(order);
    if (isActive !== undefined) image.isActive = isActive;

    await image.save();

    res.json({
      success: true,
      message: 'Carousel image updated successfully',
      image
    });
  } catch (error) {
    console.error('Update carousel image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/carousel/:id
// @desc    Delete carousel image and remove from S3 (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const image = await CarouselImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Carousel image not found' });
    }

    // Delete image from S3 if it exists
    if (image.cloudinaryPublicId) {
      try {
        await deleteFromS3(image.cloudinaryPublicId);
      } catch (err) {
        console.error('Error deleting carousel image from S3:', err);
      }
    }

    await CarouselImage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Carousel image deleted successfully'
    });
  } catch (error) {
    console.error('Delete carousel image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/carousel/batch-update-order
// @desc    Batch update carousel image orders in a single API call (Admin only)
// @access  Private/Admin
router.patch('/batch-update-order', protect, admin, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Please provide updates array' });
    }

    // Validate updates format
    for (const update of updates) {
      if (!update.id || update.order === undefined) {
        return res.status(400).json({ message: 'Each update must have id and order' });
      }
    }

    // Perform batch update using bulkWrite for efficiency
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { order: parseInt(update.order) } }
      }
    }));

    const result = await CarouselImage.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Carousel order updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Batch update order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

