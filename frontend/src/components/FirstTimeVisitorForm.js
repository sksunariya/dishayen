import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiBook, FiTarget, FiPhone, FiSend } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FirstTimeVisitorForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    className: '',
    examPreparingFor: '',
    mobileNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.className.trim()) {
      newErrors.className = 'Class is required';
    }

    if (!formData.examPreparingFor.trim()) {
      newErrors.examPreparingFor = 'Exam name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/visitor-inquiries', formData);
      toast.success('Thank you for your inquiry! We will contact you soon.');
      
      // Store in localStorage to prevent showing again
      localStorage.setItem('visitorFormSubmitted', 'true');
      
      // Reset form
      setFormData({
        name: '',
        className: '',
        examPreparingFor: '',
        mobileNumber: ''
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-dark-elevated rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-primary p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Welcome!</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white/90 mt-2 text-sm">
              Please share some details to help us serve you better
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FiBook className="w-4 h-4" />
                Class *
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                placeholder="e.g., 12th, B.Tech 2nd Year, etc."
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white ${
                  errors.className ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
              />
              {errors.className && (
                <p className="text-red-500 text-xs mt-1">{errors.className}</p>
              )}
            </div>

            {/* Exam Preparing For */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FiTarget className="w-4 h-4" />
                Exam Preparing For *
              </label>
              <input
                type="text"
                name="examPreparingFor"
                value={formData.examPreparingFor}
                onChange={handleChange}
                placeholder="e.g., JEE, NEET, UPSC, etc."
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white ${
                  errors.examPreparingFor ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
              />
              {errors.examPreparingFor && (
                <p className="text-red-500 text-xs mt-1">{errors.examPreparingFor}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white ${
                  errors.mobileNumber ? 'border-red-500' : 'border-gray-300 dark:border-dark-border'
                }`}
              />
              {errors.mobileNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiSend className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FirstTimeVisitorForm;

