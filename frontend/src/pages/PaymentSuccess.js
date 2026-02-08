import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await api.get(`/payments/verify-stripe-session/${sessionId}`);
      if (response.data.success) {
        toast.success('Payment successful! Course access granted.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-dark-elevated p-8 rounded-xl border border-dark-border"
      >
        <FiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-gray-400 mb-8">
          Your course has been added to your library. Start learning now!
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/my-courses')}
            className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
          >
            Go to My Courses
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="w-full px-6 py-3 border-2 border-neon-blue text-neon-blue font-semibold rounded-lg hover:bg-neon-blue hover:text-white transition-all"
          >
            Browse More Courses
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;

