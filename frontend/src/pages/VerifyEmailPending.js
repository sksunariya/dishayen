import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiRefreshCw, FiCheck, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const VerifyEmailPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Redirect if no email provided
  React.useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);

    try {
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data.success) {
        toast.success('Verification email sent successfully!');
        setResendSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="glass-effect rounded-2xl p-8 md:p-12">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FiMail className="text-5xl text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold gradient-text text-center mb-4"
          >
            Check Your Email
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-center text-lg mb-8"
          >
            We've sent a verification link to
          </motion.p>

          {/* Email Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-elevated rounded-xl p-4 mb-8 text-center"
          >
            <p className="text-white font-semibold text-xl break-all">{email}</p>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center mr-3 text-neon-blue">
                ✓
              </span>
              Next Steps
            </h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-neon-blue font-bold mr-3 mt-0.5">1.</span>
                <span>Open your email inbox (check spam folder if needed)</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-purple font-bold mr-3 mt-0.5">2.</span>
                <span>Find the email from Dishayen Coaching Center</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-pink font-bold mr-3 mt-0.5">3.</span>
                <span>Click the verification link to activate your account</span>
              </li>
            </ol>
          </motion.div>

          {/* Warnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8"
          >
            <div className="flex items-start">
              <div className="text-yellow-400 text-xl mr-3 mt-0.5">⏰</div>
              <div>
                <p className="text-yellow-400 font-semibold mb-1">Important</p>
                <p className="text-yellow-400/80 text-sm">
                  The verification link will expire in 24 hours. If you don't see the email within a few minutes, check your spam folder or click the resend button below.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <button
              onClick={handleResendVerification}
              disabled={resending || resendSuccess}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Resending...
                </>
              ) : resendSuccess ? (
                <>
                  <FiCheck className="text-xl" />
                  Email Sent!
                </>
              ) : (
                <>
                  <FiRefreshCw className="text-xl" />
                  Resend Verification Email
                </>
              )}
            </button>
          </motion.div>

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center pt-6 border-t border-white/10"
          >
            <Link
              to="/login"
              className="text-neon-blue hover:text-neon-purple transition-colors inline-flex items-center gap-2"
            >
              <FiArrowLeft />
              Go to Login
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400 text-sm">
              Wrong email?{' '}
              <Link
                to="/register"
                className="text-neon-blue hover:text-neon-purple transition-colors font-semibold"
              >
                Create a new account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Fun Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-center"
        >
          <div className="glass-effect rounded-xl p-6 inline-block">
            <p className="text-gray-300 text-sm">
              <span className="text-2xl mr-2">💡</span>
              <strong className="text-white">Pro Tip:</strong> Add us to your contacts to ensure our emails reach your inbox!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPending;

