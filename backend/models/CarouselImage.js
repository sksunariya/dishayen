const mongoose = require('mongoose');

const carouselImageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image URL']
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  linkUrl: {
    type: String // Optional link when image is clicked
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarouselImage', carouselImageSchema);

