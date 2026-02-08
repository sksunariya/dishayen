import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiUser, FiMail, FiCamera, FiSave, FiPhone, 
  FiAlertCircle, FiRefreshCw, FiBook, FiEdit3, FiX, FiCheck
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import api, { getAvatarUrl } from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('avatar', file);

      // Upload to backend
      const response = await api.post('/users/upload-avatar', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Fetch fresh user data from API to ensure we have the complete user object
      const userResponse = await api.get('/auth/me');
      updateUser(userResponse.data.user);
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Trigger file input click
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // Handle profile form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    setResendingVerification(true);
    
    try {
      await api.post('/auth/resend-verification', { email: user?.email });
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold gradient-text">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiEdit3 />
                Edit Profile
              </button>
            )}
          </div>

          {/* Verification Warning */}
          {!user?.isVerified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass-effect border-l-4 border-yellow-500 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 dark:bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 text-2xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-2">
                    Email Verification Required
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Your account is not verified. Please check your email <strong className="text-gray-900 dark:text-white">{user?.email}</strong> and click the verification link.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendingVerification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-effect p-6 rounded-2xl text-center sticky top-8">
                {/* Avatar with Upload */}
                <div className="relative inline-block mb-6">
                  <Avatar 
                    name={user?.name}
                    src={getAvatarUrl(user)}
                    size="2xl"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={handleCameraClick}
                    disabled={uploadingImage}
                    className="absolute bottom-2 right-2 p-3 bg-gradient-primary text-white rounded-full hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Upload profile picture"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <FiCamera className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Click camera to upload (Max 5MB)
                </p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user?.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 break-all">{user?.email}</p>
                
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <div className="px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-full capitalize">
                    {user?.role}
                  </div>
                  {user?.isVerified ? (
                    <div className="px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full border-2 border-green-500">
                      <FiCheck className="inline mr-1" />
                      Verified
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-full border-2 border-yellow-500">
                      ⚠ Not Verified
                    </div>
                  )}
                </div>

                {/* My Courses Button */}
                <Link
                  to="/my-courses"
                  className="btn-primary w-full flex items-center justify-center gap-2 mb-6"
                >
                  <FiBook />
                  My Courses
                </Link>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-dark-elevated dark:to-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Courses Enrolled</span>
                      <span className="text-neon-blue font-bold text-2xl">
                        {user?.purchasedCourses?.length || 0}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-dark-border"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Member Since</span>
                      <span className="text-gray-900 dark:text-white font-semibold text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="glass-effect p-8 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiUser className="text-neon-blue" />
                    Profile Information
                  </h3>
                  {isEditing && (
                    <button
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors"
                      title="Cancel"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={!isEditing}
                        className="input-field pl-12 w-full"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input-field pl-12 w-full opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <FiAlertCircle className="text-yellow-500" />
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="input-field pl-12 w-full"
                        placeholder="+1 (234) 567-8900"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      maxLength={500}
                      rows={4}
                      disabled={!isEditing}
                      className="input-field w-full resize-none"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="btn-outline flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold"
                      >
                        <FiX className="w-5 h-5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
