import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AddTestimonialModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    content: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit without image - will use user's avatar automatically
      await api.post('/testimonials', formData);
      toast.success('Testimonial submitted! It will appear after admin approval.');
      setFormData({ content: '', rating: 5 });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Submit testimonial error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit testimonial');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-dark-elevated rounded-xl border border-dark-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-6">Share Your Experience</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <FiStar
                      className={`w-8 h-8 transition-colors ${
                        star <= formData.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Testimonial
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={5}
                maxLength={500}
                placeholder="Share your experience with Dishayen Coaching Center..."
                className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-white resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.content.length}/500 characters
              </p>
            </div>

            {/* Info about profile picture */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                ℹ️ Your profile picture will be displayed with your testimonial
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !formData.content}
              className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Testimonial'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Your testimonial will be reviewed by our team before being published.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddTestimonialModal;

