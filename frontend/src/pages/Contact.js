import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare,
  FiClock, FiGlobe, FiFacebook, FiTwitter, FiInstagram, FiLinkedin
} from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofill user data if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || ''
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // You can create a backend endpoint for contact form submissions
      await api.post('/contact', formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      
      // Reset form but preserve user data if logged in
      if (isAuthenticated && user) {
        const nameParts = user.name ? user.name.split(' ') : ['', ''];
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          message: ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: 'Email',
      value: 'info@dishayencoaching.com',
      link: 'mailto:info@dishayencoaching.com',
      color: 'text-blue-500'
    },
    {
      icon: FiPhone,
      title: 'Phone',
      value: '+91 (555) 123-4567',
      link: 'tel:+915551234567',
      color: 'text-green-500'
    },
    {
      icon: FiMapPin,
      title: 'Location',
      value: 'New Delhi, India',
      color: 'text-red-500'
    },
    {
      icon: FiClock,
      title: 'Working Hours',
      value: 'Mon - Sat: 9AM - 6PM',
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Have a question or want to work together? We'd love to hear from you.
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Contact Cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass-effect p-6 rounded-2xl border border-gray-200 dark:border-dark-border hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${info.color.split('-')[1]}-100 to-${info.color.split('-')[1]}-200 dark:from-${info.color.split('-')[1]}-500/20 dark:to-${info.color.split('-')[1]}-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <info.icon className={`w-6 h-6 ${info.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {info.title}
                  </h3>
                  {info.link ? (
                    <a
                      href={info.link}
                      className="text-gray-600 dark:text-gray-400 hover:text-neon-blue dark:hover:text-neon-blue transition-colors"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      {info.value}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect p-6 rounded-2xl border border-gray-200 dark:border-dark-border"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiGlobe className="text-neon-blue" />
                Follow Us On Social
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Stay connected with us on social media for updates, tips, and educational content.
              </p>
              <div className="flex gap-4">
                {[
                  { name: 'Facebook', icon: FaFacebookF, color: 'from-blue-600 to-blue-700', link: '#' },
                  { name: 'Twitter', icon: FaTwitter, color: 'from-sky-500 to-sky-600', link: '#' },
                  { name: 'Instagram', icon: FaInstagram, color: 'from-pink-600 to-purple-600', link: '#' },
                  { name: 'LinkedIn', icon: FaLinkedinIn, color: 'from-blue-700 to-blue-800', link: '#' }
                ].map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 bg-gradient-to-br ${platform.color} text-white rounded-lg hover:scale-110 hover:shadow-xl transition-all group`}
                    title={platform.name}
                  >
                    <platform.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-8 rounded-3xl border-2 border-blue-200 dark:border-blue-500/30 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <FiMessageSquare className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Send Us a Message
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Email * {isAuthenticated && <span className="text-xs text-gray-500">(From your account)</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isAuthenticated}
                  className={`input-field w-full ${isAuthenticated ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''}`}
                  placeholder="john@example.com"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-field w-full resize-none"
                  placeholder="Tell us what you're thinking about..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.message.length} characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg group"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <FiSend className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                We'll respond within 24-48 hours during business days.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

