import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.get(`/auth/verify-email/${token}`);
      setStatus('success');
      toast.success('Email verified successfully!');
    } catch (error) {
      setStatus('error');
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {status === 'verifying' && (
          <div>
            <div className="spinner mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
            <p className="text-gray-400">Please wait while we verify your email address</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-dark-elevated p-8 rounded-xl border border-dark-border">
            <FiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400 mb-6">Your email has been successfully verified. You can now access all features.</p>
            <a
              href="/courses"
              className="inline-block px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
            >
              Start Learning
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-dark-elevated p-8 rounded-xl border border-dark-border">
            <FiXCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">The verification link is invalid or has expired.</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
            >
              Back to Login
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

