# 🚀 EduPlatform - Futuristic Education Platform

A modern, full-stack MERN (MongoDB, Express.js, React.js, Node.js) education platform with a futuristic design, featuring course management, payment integration, user authentication, and admin dashboard.

![Platform](https://img.shields.io/badge/Platform-MERN-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

## ✨ Features

### 🎨 Design
- **Futuristic UI**: Dark mode with neon/glow accents
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Smooth Animations**: Framer Motion animations throughout
- **Dark/Light Mode Toggle**: User preference saved locally
- **Glass Morphism Effects**: Modern UI patterns

### 👤 User Roles
- **Students**: Browse, purchase courses, submit testimonials
- **Admins**: Full platform management capabilities

### 🔐 Authentication & Security
- JWT-based authentication
- Email verification (Nodemailer)
- Google OAuth 2.0 (Single Sign-On)
- Password hashing with bcrypt
- Protected routes and role-based access
- Secure session management

### 📚 Course Features
- Browse courses (public access)
- Advanced filtering (category, level, search)
- Course detail pages with sample videos
- Purchase courses (Stripe/Razorpay integration)
- My Courses section for enrolled students
- Course ratings and reviews system
- YouTube video integration

### 💳 Payment Integration
- **Stripe** payment gateway
- **Razorpay** support (alternative)
- Secure checkout process
- Payment verification
- Purchase history
- Email confirmations

### 💬 Testimonials
- Student testimonials with ratings
- Admin approval system
- Auto-sliding carousel on homepage
- Image support

### 👨‍💼 Admin Dashboard
- Analytics and statistics
- User management
- Course management (CRUD operations)
- Testimonial approval/rejection
- Revenue tracking
- Recent enrollments view

### 🔔 Notifications
- In-app notification system
- Email notifications for:
  - Email verification
  - Welcome messages
  - Purchase confirmations
  - Testimonial approvals
  - New course announcements

### ⚡ Performance
- Lazy loading for images
- Code splitting
- Optimized bundle size
- Fast page loads
- Efficient API calls

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - UI library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router v6** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Swiper** - Carousel
- **React Icons** - Icon library
- **React Lazy Load Image** - Image optimization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Passport.js** - OAuth authentication
- **Stripe & Razorpay** - Payment processing
- **Helmet** - Security headers
- **Express Rate Limit** - API protection
- **Morgan** - Logging
- **Compression** - Response compression

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas account)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd test_website
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your credentials
```

**Required Environment Variables** (backend/.env):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/education-platform
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/education-platform

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@educationplatform.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Razorpay (Alternative)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Session Secret
SESSION_SECRET=your_session_secret_key_change_this
```

**Seed the Database** (optional - adds sample data):

```bash
npm run seed
```

This will create:
- Admin account: `admin@educationplatform.com` / `admin123`
- Sample student accounts
- Sample courses
- Sample testimonials

**Start Backend Server**:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file
```

**Required Environment Variables** (frontend/.env):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

**Start Frontend**:

```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔧 Configuration Guides

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - Your production callback URL
6. Copy Client ID and Client Secret to `.env` files

### Setting up Stripe

1. Create account at [Stripe](https://stripe.com/)
2. Get API keys from Dashboard
3. Add to `.env` files
4. Test with provided test cards

### Setting up Nodemailer (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → App Passwords
   - Generate password for "Mail"
3. Use this password in `EMAIL_PASSWORD`

### Setting up MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database user
4. Whitelist your IP (or allow from anywhere for development)
5. Get connection string and add to `MONGODB_URI`

## 📁 Project Structure

```
test_website/
├── backend/
│   ├── config/
│   │   └── passport.js          # Passport OAuth configuration
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Course.js             # Course model
│   │   ├── Testimonial.js        # Testimonial model
│   │   ├── Review.js             # Review model
│   │   └── Payment.js            # Payment model
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── courses.js            # Course routes
│   │   ├── testimonials.js       # Testimonial routes
│   │   ├── reviews.js            # Review routes
│   │   ├── payments.js           # Payment routes
│   │   ├── users.js              # User routes
│   │   ├── admin.js              # Admin routes
│   │   └── notifications.js      # Notification routes
│   ├── seeders/
│   │   └── seed.js               # Database seeder
│   ├── utils/
│   │   └── emailService.js       # Email utilities
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                 # Entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js         # Navigation bar
│   │   │   ├── Footer.js         # Footer
│   │   │   ├── CourseCard.js     # Course card component
│   │   │   ├── LoadingSpinner.js # Loading component
│   │   │   ├── ProtectedRoute.js # Protected route wrapper
│   │   │   └── AdminRoute.js     # Admin route wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Authentication context
│   │   │   └── ThemeContext.js   # Theme context
│   │   ├── pages/
│   │   │   ├── Home.js            # Homepage
│   │   │   ├── Courses.js         # Courses listing
│   │   │   ├── CourseDetail.js    # Course details
│   │   │   ├── Login.js           # Login page
│   │   │   ├── Register.js        # Registration page
│   │   │   ├── VerifyEmail.js     # Email verification
│   │   │   ├── GoogleCallback.js  # OAuth callback
│   │   │   ├── Profile.js         # User profile
│   │   │   ├── MyCourses.js       # User's courses
│   │   │   ├── PaymentSuccess.js  # Payment success
│   │   │   ├── PaymentCancel.js   # Payment cancel
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js
│   │   │       ├── ManageCourses.js
│   │   │       ├── ManageTestimonials.js
│   │   │       └── ManageUsers.js
│   │   ├── utils/
│   │   │   └── api.js             # Axios configuration
│   │   ├── App.js                 # Main app component
│   │   ├── index.js               # Entry point
│   │   └── index.css              # Global styles
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/resend-verification` - Resend verification email

### Courses
- `GET /api/courses` - Get all courses (public)
- `GET /api/courses/:id` - Get single course (public)
- `GET /api/courses/user/purchased` - Get user's purchased courses (protected)
- `GET /api/courses/categories/all` - Get all categories

### Testimonials
- `GET /api/testimonials` - Get approved testimonials (public)
- `POST /api/testimonials` - Create testimonial (protected)
- `GET /api/testimonials/my-testimonials` - Get user's testimonials (protected)
- `PUT /api/testimonials/:id` - Update testimonial (protected)
- `DELETE /api/testimonials/:id` - Delete testimonial (protected)

### Reviews
- `GET /api/reviews/course/:courseId` - Get course reviews
- `POST /api/reviews/:courseId` - Add review (protected)
- `PUT /api/reviews/:reviewId` - Update review (protected)
- `DELETE /api/reviews/:reviewId` - Delete review (protected)

### Payments
- `POST /api/payments/create-stripe-session` - Create Stripe checkout (protected)
- `GET /api/payments/verify-stripe-session/:sessionId` - Verify payment (protected)
- `POST /api/payments/create-razorpay-order` - Create Razorpay order (protected)
- `POST /api/payments/verify-razorpay-payment` - Verify Razorpay payment (protected)
- `GET /api/payments/my-payments` - Get payment history (protected)

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics (admin)
- `POST /api/admin/courses` - Create course (admin)
- `PUT /api/admin/courses/:id` - Update course (admin)
- `DELETE /api/admin/courses/:id` - Delete course (admin)
- `GET /api/admin/testimonials` - Get all testimonials (admin)
- `PUT /api/admin/testimonials/:id/approve` - Approve testimonial (admin)
- `PUT /api/admin/testimonials/:id/reject` - Reject testimonial (admin)
- `DELETE /api/admin/testimonials/:id` - Delete testimonial (admin)
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/users/:id` - Get user details (admin)
- `DELETE /api/admin/users/:id` - Delete user (admin)
- `GET /api/admin/payments` - Get all payments (admin)

## 🎨 Customization

### Changing Colors

Edit `frontend/tailwind.config.js`:

```javascript
colors: {
  neon: {
    blue: '#667eea',    // Change these colors
    purple: '#764ba2',
    pink: '#f093fb',
    cyan: '#4facfe',
  }
}
```

### Adding New Course Categories

Edit backend course model or directly in MongoDB:

```javascript
// backend/models/Course.js
enum: ['Web Development', 'Data Science', 'Your New Category']
```

## 🚢 Deployment

### Deploy Backend (Railway/Render)

1. Push code to GitHub
2. Connect Railway/Render to your repository
3. Set environment variables
4. Deploy

### Deploy Frontend (Vercel)

1. Push code to GitHub
2. Connect Vercel to your repository
3. Set environment variables
4. Deploy

### Deploy Database (MongoDB Atlas)

Already cloud-based - just update connection string

## 🧪 Testing

```bash
# Backend tests (if implemented)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Sample Credentials

After running `npm run seed` in backend:

**Admin Account:**
- Email: `admin@educationplatform.com`
- Password: `admin123`

**Student Account:**
- Email: `john@example.com`
- Password: `password123`

**Test Credit Cards (Stripe):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or connection string is correct
- Check firewall settings
- Verify database user permissions

### Email Not Sending
- Verify Gmail app password
- Check firewall blocking SMTP
- Enable "Less secure app access" (not recommended) or use OAuth2

### Payment Issues
- Verify API keys are correct
- Check webhook configuration
- Ensure test mode is enabled during development

### Build Errors
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- MongoDB team for the database
- All open-source contributors

## 📞 Support

For support, email support@educationplatform.com or create an issue in the repository.

---

**Built with ❤️ using the MERN Stack**

