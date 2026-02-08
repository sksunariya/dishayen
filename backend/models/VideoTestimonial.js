const mongoose = require('mongoose');

const videoTestimonialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  course: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['upload', 'youtube'],
    required: true
  },
  // For uploaded videos
  videoUrl: {
    type: String,
    default: null
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  // For YouTube videos
  youtubeUrl: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  duration: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VideoTestimonial', videoTestimonialSchema);

