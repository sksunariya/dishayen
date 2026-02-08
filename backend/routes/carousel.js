const express = require('express');
const router = express.Router();
const multer = require('multer');
const CarouselImage = require('../models/CarouselImage');
const { protect, admin } = require('../middleware/auth');
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
// @desc    Add new carousel image with Cloudinary upload (Admin only)
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

    // Upload image to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'carousel',
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    const image = await CarouselImage.create({
      title,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
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
// @desc    Update carousel image with optional Cloudinary upload (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, linkUrl, order, isActive } = req.body;
    
    const image = await CarouselImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Carousel image not found' });
    }

    // If new image is uploaded, update on Cloudinary
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (image.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(image.cloudinaryPublicId);
        } catch (err) {
          console.error('Error deleting old carousel image from Cloudinary:', err);
        }
      }

      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'carousel',
        resource_type: 'auto',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      image.imageUrl = result.secure_url;
      image.cloudinaryPublicId = result.public_id;
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
// @desc    Delete carousel image and remove from Cloudinary (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const image = await CarouselImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Carousel image not found' });
    }

    // Delete image from Cloudinary if it exists
    if (image.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (err) {
        console.error('Error deleting carousel image from Cloudinary:', err);
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

