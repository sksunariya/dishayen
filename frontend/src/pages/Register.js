import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedAlert, setBlockedAlert] = useState(null);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBlockedAlert(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      // Navigate to verification pending page with email
      navigate('/verify-email-pending', { 
        state: { email: formData.email },
        replace: true 
      });
    } catch (error) {
      console.error('Register error:', error);
      
      // Check if email is blocked
      if (error.response?.data?.code === 'EMAIL_BLOCKED' || error.response?.data?.isBlocked) {
        setBlockedAlert({
          show: true,
          contactEmail: error.response?.data?.contactEmail || 'support@dishayencoaching.com'
        });
      } else {
        // Extract error message from response
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Registration failed. Please try again.';
        setError(errorMessage);
        
        // Shake animation for form
        const form = document.getElementById('register-form');
        if (form) {
          form.classList.add('shake');
          setTimeout(() => form.classList.remove('shake'), 650);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="text-4xl font-bold gradient-text mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Start your learning journey today</p>
        </div>

        <form 
          id="register-form"
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6 bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border shadow-xl"
        >
          {/* Blocked Email Alert */}
          <CustomAlert
            show={blockedAlert?.show || false}
            onClose={() => setBlockedAlert(null)}
            type="error"
            title="Email Blocked"
            message={`This email is blocked. Please contact support for assistance at ${blockedAlert?.contactEmail || 'support@dishayencoaching.com'} or use the Contact Us page.`}
            actions={[
              {
                label: 'Contact Support',
                onClick: () => navigate('/contact'),
                className: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors'
              }
            ]}
          />

          {/* Error Alert */}
          <CustomAlert
            show={!!error && !blockedAlert?.show}
            onClose={() => setError('')}
            type="error"
            title="Registration Failed"
            message={error}
          />

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none transition-colors text-gray-900 dark:text-white ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-dark-border focus:border-neon-blue'
                  }`}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none transition-colors text-gray-900 dark:text-white ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-dark-border focus:border-neon-blue'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none transition-colors text-gray-900 dark:text-white ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-dark-border focus:border-neon-blue'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none transition-colors text-gray-900 dark:text-white ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 dark:border-dark-border focus:border-neon-blue'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 rounded border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-neon-blue focus:ring-neon-blue"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <Link to="/terms" className="text-neon-blue hover:text-neon-purple">
                Terms and Conditions
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            )}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-dark-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-dark-elevated text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-gray-300 dark:border-dark-border rounded-lg hover:border-neon-blue transition-all bg-white dark:bg-transparent text-gray-700 dark:text-white"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Sign up with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-blue hover:text-neon-purple transition-colors font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;

