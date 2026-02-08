import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedAlert, setBlockedAlert] = useState(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Check for blocked account error from URL params (from Google OAuth)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam === 'account_blocked') {
      setBlockedAlert({
        show: true,
        contactEmail: process.env.REACT_APP_ADMIN_EMAIL || 'support@dishayencoaching.com'
      });
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBlockedAlert(null);

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if account is blocked
      if (error.response?.data?.code === 'ACCOUNT_BLOCKED' || error.response?.data?.isBlocked) {
        setBlockedAlert({
          show: true,
          contactEmail: error.response?.data?.contactEmail || 'support@dishayencoaching.com'
        });
      } else {
        // Extract error message from response
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Login failed. Please check your credentials and try again.';
        setError(errorMessage);
        
        // Shake animation for form
        const form = document.getElementById('login-form');
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
            Welcome Back
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Sign in to continue your learning journey</p>
        </div>

        <form 
          id="login-form"
          onSubmit={handleSubmit} 
          className="mt-8 space-y-6 bg-white dark:bg-dark-elevated p-8 rounded-xl border border-gray-200 dark:border-dark-border shadow-xl"
        >
          {/* Blocked Account Alert */}
          <CustomAlert
            show={blockedAlert?.show || false}
            onClose={() => setBlockedAlert(null)}
            type="error"
            title="Account Blocked"
            message={`Your account has been blocked. Please contact support for assistance at ${blockedAlert?.contactEmail || 'support@dishayencoaching.com'} or use the Contact Us page.`}
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
            title="Login Failed"
            message={error}
          />

          <div className="space-y-4">
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-surface text-neon-blue focus:ring-neon-blue"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="text-neon-blue hover:text-neon-purple transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            )}
            {loading ? 'Signing in...' : 'Sign In'}
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
            <span>Sign in with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-blue hover:text-neon-purple transition-colors font-semibold">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;

