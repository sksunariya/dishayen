import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="glass-effect rounded-2xl p-8 text-center shadow-2xl">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
              className="w-24 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-neon"
            >
              <FiCheck className="text-5xl text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold gradient-text mb-4"
            >
              Check Your Email
            </motion.h1>

            {/* Email Sent Message */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-300 mb-8"
            >
              We've sent a password reset link to<br/>
              <strong className="text-neon-blue font-semibold">{email}</strong>
            </motion.p>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-elevated dark:to-dark-surface rounded-xl p-6 mb-6 text-left border border-gray-200 dark:border-white/10"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-neon-blue">📋</span>
                Next Steps:
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neon-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span>Check your email inbox (and spam folder)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neon-blue text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Click the password reset link in the email</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neon-blue text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Create a secure new password</span>
                </li>
              </ul>
            </motion.div>

            {/* Expiry Warning */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600/30 rounded-xl p-4 mb-8"
            >
              <p className="text-yellow-700 dark:text-yellow-300 text-sm font-semibold flex items-center justify-center gap-2">
                <span className="text-xl">⏰</span>
                The reset link will expire in 10 minutes
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={() => setEmailSent(false)}
                className="btn-secondary w-full py-3"
              >
                Resend Email
              </button>

              <Link
                to="/login"
                className="btn-outline w-full flex items-center justify-center gap-2 py-3 group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Login
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
            className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-neon"
          >
            <FiMail className="text-4xl text-white" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold gradient-text mb-3"
          >
            Forgot Password?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-300 text-lg"
          >
            No worries! We'll send you reset instructions.
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FiMail className="text-gray-400 dark:text-gray-500 group-focus-within:text-neon-blue transition-colors duration-300" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="input-field pl-12 w-full text-base"
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                We'll send a password reset link to this email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base font-bold relative overflow-hidden group"
            >
              <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <FiMail className="text-lg" />
                Send Reset Link
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </div>
                </span>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 text-center">
            <Link
              to="/login"
              className="text-neon-blue hover:text-neon-purple transition-colors inline-flex items-center gap-2 font-medium group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Login
            </Link>
          </div>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-neon-blue hover:text-neon-purple transition-colors font-semibold hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4"
        >
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            🔒 For your security, the reset link expires in 10 minutes
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;

