import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiXCircle } from 'react-icons/fi';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-dark-elevated p-8 rounded-xl border border-dark-border"
      >
        <FiXCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h2>
        <p className="text-gray-400 mb-8">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/courses')}
            className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
          >
            Back to Courses
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;

