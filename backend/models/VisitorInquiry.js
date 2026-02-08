const mongoose = require('mongoose');

const visitorInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  className: {
    type: String,
    required: [true, 'Please provide your class'],
    trim: true,
    maxlength: [50, 'Class cannot be more than 50 characters']
  },
  examPreparingFor: {
    type: String,
    required: [true, 'Please provide the exam you are preparing for'],
    trim: true,
    maxlength: [200, 'Exam name cannot be more than 200 characters']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide your mobile number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  status: {
    type: String,
    enum: ['unattended', 'acknowledged', 'contacted', 'completed', 'rejected'],
    default: 'unattended'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    default: ''
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VisitorInquiry', visitorInquirySchema);

