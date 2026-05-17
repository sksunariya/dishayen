import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MovingNotification from './components/MovingNotification';
import FirstTimeVisitorForm from './components/FirstTimeVisitorForm';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifyEmailPending = lazy(() => import('./pages/VerifyEmailPending'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageCourses = lazy(() => import('./pages/admin/ManageCourses'));
const ManageTestimonials = lazy(() => import('./pages/admin/ManageTestimonials'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageCarousel = lazy(() => import('./pages/admin/ManageCarousel'));
const ManageQueries = lazy(() => import('./pages/admin/ManageQueries'));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'));
const ManageVideoTestimonials = lazy(() => import('./pages/admin/ManageVideoTestimonials'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const ManageNews = lazy(() => import('./pages/admin/ManageNews'));
const ManageVisitorInquiries = lazy(() => import('./pages/admin/ManageVisitorInquiries'));
const PrivacyPolicy    = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService   = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy     = lazy(() => import('./pages/CookiePolicy'));
const ManageLegalPages = lazy(() => import('./pages/admin/ManageLegalPages'));
const Results = lazy(() => import('./pages/Results'));
const ManageResults = lazy(() => import('./pages/admin/ManageResults'));

function App() {
  const [showVisitorForm, setShowVisitorForm] = useState(false);

  useEffect(() => {
    // Check if user has already submitted the form
    const hasSubmitted = localStorage.getItem('visitorFormSubmitted');
    if (!hasSubmitted) {
      // Show form after a short delay for better UX
      const timer = setTimeout(() => {
        setShowVisitorForm(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFormSuccess = () => {
    setShowVisitorForm(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300 overflow-x-hidden">
      <ScrollToTop />
      <MovingNotification />
      <FirstTimeVisitorForm
        isOpen={showVisitorForm}
        onClose={() => setShowVisitorForm(false)}
        onSuccess={handleFormSuccess}
      />
      <Navbar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/results" element={<Results />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
          <Route path="/auth/google/success" element={<GoogleCallback />} />
          <Route path="/privacy"  element={<PrivacyPolicy />} />
          <Route path="/terms"   element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />

          {/* Protected routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/my-courses" element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } />
          <Route path="/payment/cancel" element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/courses" element={
            <AdminRoute>
              <ManageCourses />
            </AdminRoute>
          } />
          <Route path="/admin/testimonials" element={
            <AdminRoute>
              <ManageTestimonials />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <ManageUsers />
            </AdminRoute>
          } />
          <Route path="/admin/carousel" element={
            <AdminRoute>
              <ManageCarousel />
            </AdminRoute>
          } />
          <Route path="/admin/queries" element={
            <AdminRoute>
              <ManageQueries />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <SiteSettings />
            </AdminRoute>
          } />
          <Route path="/admin/video-testimonials" element={
            <AdminRoute>
              <ManageVideoTestimonials />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <ManageCategories />
            </AdminRoute>
          } />
          <Route path="/admin/news" element={
            <AdminRoute>
              <ManageNews />
            </AdminRoute>
          } />
          <Route path="/admin/visitor-inquiries" element={
            <AdminRoute>
              <ManageVisitorInquiries />
            </AdminRoute>
          } />
          <Route path="/admin/legal" element={
            <AdminRoute>
              <ManageLegalPages />
            </AdminRoute>
          } />
          <Route path="/admin/results" element={
            <AdminRoute>
              <ManageResults />
            </AdminRoute>
          } />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}

export default App;

