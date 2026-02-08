import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiClock, FiUsers, FiPlay, FiCheckCircle, FiAlertCircle, FiCreditCard, FiX } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isVerified } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase this course');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (!isVerified) {
      toast.error('Please verify your email before purchasing');
      return;
    }

    setShowPaymentModal(true);
  };

  const handleStripePayment = async () => {
    setPurchasing(true);
    setShowPaymentModal(false);
    
    try {
      const response = await api.post('/payments/create-stripe-session', {
        courseId: id
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setPurchasing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPurchasing(true);
    setShowPaymentModal(false);

    try {
      // Create Razorpay order
      const response = await api.post('/payments/create-razorpay-order', {
        courseId: id
      });

      const { orderId, amount, currency, keyId } = response.data;

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Dishayen Coaching Center',
        description: course.title,
        image: course.image,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post('/payments/verify-razorpay-payment', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              courseId: id
            });

            toast.success(verifyResponse.data.message);
            navigate('/payment/success');
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Payment verification failed');
            setPurchasing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || ''
        },
        theme: {
          color: '#6366F1'
        },
        modal: {
          ondismiss: function() {
            setPurchasing(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h2>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-gradient-primary text-white rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Payment Method Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiCreditCard className="text-neon-blue" />
                  Select Payment Method
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Course Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-transparent">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">You are purchasing:</p>
                <p className="text-gray-900 dark:text-white font-semibold">{course.title}</p>
                <p className="text-neon-blue text-2xl font-bold mt-2">₹{course.price.toLocaleString()}</p>
              </div>

              {/* Payment Options */}
              <div className="space-y-4">
                {/* Razorpay Option */}
                <button
                  onClick={handleRazorpayPayment}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl transition-all flex items-center justify-between group hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 120 30" className="w-10 h-10">
                        <path fill="#072654" d="M0 0h120v30H0z"/>
                        <text x="10" y="21" fill="#FFF" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">Razorpay</text>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Razorpay</p>
                      <p className="text-sm text-blue-100">UPI, Cards, NetBanking & More</p>
                    </div>
                  </div>
                  <FiCheckCircle className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Stripe Option */}
                <button
                  onClick={handleStripePayment}
                  className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-xl transition-all flex items-center justify-between group hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 50 21" className="w-10 h-6">
                        <path fill="#635BFF" d="M49.998 10.499c0-5.799-2.891-10.499-8.342-10.499-5.45 0-8.89 4.7-8.89 10.448 0 6.899 3.891 10.398 9.493 10.398 2.74 0 4.791-.599 6.392-1.449v-4.65c-1.6.8-3.451 1.3-5.751 1.3-2.291 0-4.291-.8-4.542-3.599h11.591c.049-.4.049-.999.049-1.949zm-11.74-2.199c0-2.7 1.65-3.799 3.4-3.799 1.699 0 3.3 1.099 3.3 3.799h-6.7zM29.008 0c-2.19 0-3.591.999-4.392 1.699l-.3-1.299h-5.15v27.694l5.85-1.25.05-6.698c.85.599 2.091 1.449 4.142 1.449 4.192 0 8.042-3.349 8.042-10.548C37.2 3.948 33.15 0 29.008 0zm-1.4 15.597c-1.4 0-2.191-.499-2.741-1.099l-.05-8.696c.6-.699 1.45-1.149 2.791-1.149 2.141 0 3.641 2.399 3.641 5.448 0 3.149-1.45 5.496-3.641 5.496zM11.208 2.499L17.108 1.2V0L11.208 1.3v1.199zm5.9 2.199h-5.9v15.598h5.9V4.698zM6.157 6.397l-.35-1.699H.508v15.598h5.85V9.697c1.4-1.8 3.741-1.45 4.492-1.149V3.098c-.8-.35-3.441-.849-4.692 3.3z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Stripe</p>
                      <p className="text-sm text-purple-100">International Cards</p>
                    </div>
                  </div>
                  <FiCheckCircle className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <FiCheckCircle className="flex-shrink-0" />
                  Secure payment powered by industry-leading encryption
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-gradient-primary text-white text-sm font-semibold rounded-full">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white dark:bg-dark-elevated text-gray-900 dark:text-white text-sm rounded-full border border-gray-200 dark:border-dark-border">
                  {course.level}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                {course.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-gray-900 dark:text-white font-semibold">{course.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400">({course.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FiUsers className="w-5 h-5" />
                  <span>{course.enrolledStudents} students</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FiClock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400">
                <span className="text-gray-900 dark:text-white font-semibold">Instructor:</span> {course.instructor}
              </p>
            </motion.div>
          </div>

          {/* Purchase card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border sticky top-24 shadow-lg"
            >
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-6"
              />

              <div className="mb-6">
                <span className="text-4xl font-bold text-neon-blue">₹{course.price.toLocaleString()}</span>
              </div>

              {course.isPurchased ? (
                <button
                  onClick={() => navigate('/my-courses')}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg mb-3"
                >
                  Already Purchased - View in My Courses
                </button>
              ) : (
                <button
                  onClick={handlePurchaseClick}
                  disabled={purchasing}
                  className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
                >
                  <FiCreditCard className="w-5 h-5" />
                  {purchasing ? 'Processing...' : 'Buy Now'}
                </button>
              )}

              {!isVerified && isAuthenticated && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    Please verify your email to purchase courses
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Course content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Course</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
            </div>

            {/* What you'll learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {course.whatYouWillLearn.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <FiCheckCircle className="w-5 h-5 text-neon-blue flex-shrink-0 mt-1" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample videos */}
            {course.sampleVideos && course.sampleVideos.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sample Videos</h2>
                <div className="space-y-4">
                  {course.sampleVideos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-surface rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface/70 transition-colors border border-gray-200 dark:border-transparent">
                      <div className="flex items-center space-x-3">
                        <FiPlay className="w-5 h-5 text-neon-blue" />
                        <span className="text-gray-900 dark:text-white">{video.title}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{video.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border mb-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h3>
                <ul className="space-y-2">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                      <span className="text-neon-blue mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CourseDetail;

