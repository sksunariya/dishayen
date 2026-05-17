const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    trim: true,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['upload', 'link'],
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  s3Key: {
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
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
