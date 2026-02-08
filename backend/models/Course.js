const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Please provide a short description'],
    maxlength: [300, 'Short description cannot be more than 300 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/800x600?text=Course+Thumbnail'
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  sampleVideos: [{
    title: String,
    youtubeUrl: {
      type: String,
      match: [/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/, 'Please provide a valid YouTube URL']
    },
    duration: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  level: {
    type: String,
    required: [true, 'Please provide a difficulty level'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: String,
    required: [true, 'Please provide course duration']
  },
  instructor: {
    type: String,
    required: [true, 'Please provide instructor name']
  },
  whatYouWillLearn: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate reviews
courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Calculate average rating when reviews are updated
courseSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    {
      $match: { course: this._id }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.totalReviews = stats[0].totalReviews;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }

  await this.save();
};

module.exports = mongoose.model('Course', courseSchema);

