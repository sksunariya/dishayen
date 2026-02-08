const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    required: [true, 'Please provide message'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isRegisteredUser: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responseMessage: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient querying
contactQuerySchema.index({ status: 1, createdAt: -1 });
contactQuerySchema.index({ email: 1 });
contactQuerySchema.index({ assignedTo: 1 });

// Virtual for full name
contactQuerySchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to mark as resolved
contactQuerySchema.methods.markResolved = async function(userId) {
  this.status = 'Resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = userId;
  await this.save();
};

// Method to mark as closed
contactQuerySchema.methods.markClosed = async function() {
  this.status = 'Closed';
  await this.save();
};

module.exports = mongoose.model('ContactQuery', contactQuerySchema);

