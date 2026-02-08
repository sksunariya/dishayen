import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [resetToken]);

  const verifyToken = async () => {
    try {
      const response = await api.get(`/auth/reset-password/${resetToken}`);
      
      if (response.data.success) {
        setTokenValid(true);
        setUserEmail(response.data.email);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      setTokenValid(false);
      toast.error(error.response?.data?.message || 'Invalid or expired reset token');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(`/auth/reset-password/${resetToken}`, {
        password
      });

      if (response.data.success) {
        toast.success('Password reset successfully!');
        setResetSuccess(true);

        // Log the user in automatically
        login(response.data.token, response.data.user);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-gray-300">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="glass-effect rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiAlertCircle className="text-4xl text-red-500" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Invalid Reset Link
            </h1>

            <p className="text-gray-300 mb-6">
              This password reset link is invalid or has expired. Reset links are only valid for 10 minutes.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to="/forgot-password"
                className="btn-primary w-full"
              >
                Request New Reset Link
              </Link>

              <Link
                to="/login"
                className="btn-outline w-full"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="glass-effect rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheck className="text-4xl text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold gradient-text mb-4">
              Password Reset Successful!
            </h1>

            <p className="text-gray-300 mb-6">
              Your password has been reset successfully. You are now logged in.
            </p>

            <div className="animate-pulse text-neon-blue">
              Redirecting to homepage...
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FiLock className="text-4xl text-white" />
          </motion.div>

          <h1 className="text-4xl font-bold gradient-text mb-4">
            Reset Password
          </h1>
          <p className="text-gray-300">
            Create a new password for <strong className="text-white">{userEmail}</strong>
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-field pl-12 pr-12 w-full"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="input-field pl-12 pr-12 w-full"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="text-neon-blue hover:text-neon-purple transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

