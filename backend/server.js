const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const testimonialRoutes = require('./routes/testimonials');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const carouselRoutes = require('./routes/carousel');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const videoTestimonialRoutes = require('./routes/videoTestimonials');
const categoryRoutes = require('./routes/categories');
const newsRoutes = require('./routes/news');
const visitorInquiryRoutes = require('./routes/visitorInquiries');
const resultsRoutes = require('./routes/results');

// Import passport config
require('./config/passport');

// Import cleanup utilities
const { setupCleanupJobs } = require('./utils/cleanup');

const app = express();

// Security middleware with custom CSP for images
const s3BucketUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "http://localhost:5000", "http://localhost:3000", s3BucketUrl],
      "media-src": ["'self'", "blob:", s3BucketUrl],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(compression());

// Rate limiting - More relaxed for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // 500 in dev, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain routes if needed
  skip: (req) => {
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV === 'development' && 
        (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  }
});
app.use('/api', limiter);

// CORS configuration - Must be before other middleware
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  // Setup cleanup jobs after successful DB connection
  setupCleanupJobs();
})
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/video-testimonials', videoTestimonialRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/visitor-inquiries', visitorInquiryRoutes);
app.use('/api/results', resultsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

