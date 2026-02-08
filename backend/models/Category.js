const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSystemCategory: {
    type: Boolean,
    default: false
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

// Prevent deletion of system categories
categorySchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystemCategory) {
    return next(new Error('System categories cannot be deleted'));
  }
  next();
});

categorySchema.pre('findOneAndDelete', async function(next) {
  const category = await this.model.findOne(this.getFilter());
  if (category && category.isSystemCategory) {
    return next(new Error('System categories cannot be deleted'));
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);

