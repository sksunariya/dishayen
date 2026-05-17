const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a course URL'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/800x600?text=Course+Thumbnail'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
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
  // Legacy fields — kept for existing data, no longer used by new courses
  description: { type: String },
  shortDescription: { type: String },
  price: { type: Number },
  cloudinaryPublicId: { type: String, default: null },
  sampleVideos: [{ title: String, youtubeUrl: String, duration: String }],
  level: { type: String },
  duration: { type: String },
  instructor: { type: String },
  whatYouWillLearn: [{ type: String }],
  requirements: [{ type: String }],
  enrolledStudents: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.methods.calculateAverageRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { course: this._id } },
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
