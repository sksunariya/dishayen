import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiVideo, FiYoutube, FiUpload, FiX, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSave, FiPlus } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CustomAlert from '../../components/CustomAlert';

const ManageVideoTestimonials = () => {
  const [videoTestimonials, setVideoTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const hasFetched = useRef(false);

  const [formData, setFormData] = useState({
    title: '',
    studentName: '',
    course: '',
    type: 'youtube',
    youtubeUrl: '',
    videoFile: null,
    duration: '',
    order: 0
  });

  const [editData, setEditData] = useState({
    id: '',
    title: '',
    studentName: '',
    course: '',
    isActive: true,
    order: 0,
    duration: ''
  });

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchVideoTestimonials();
    }
  }, []);

  const fetchVideoTestimonials = async () => {
    try {
      const response = await api.get('/video-testimonials/all');
      setVideoTestimonials(response.data.videoTestimonials);
    } catch (error) {
      console.error('Error fetching video testimonials:', error);
      toast.error('Failed to load video testimonials');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file size must be less than 100MB');
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('studentName', formData.studentName);
      data.append('course', formData.course);
      data.append('type', formData.type);
      data.append('duration', formData.duration);
      data.append('order', formData.order);

      if (formData.type === 'youtube') {
        if (!formData.youtubeUrl) {
          toast.error('Please provide YouTube URL');
          setUploading(false);
          return;
        }
        data.append('youtubeUrl', formData.youtubeUrl);
      } else if (formData.type === 'upload') {
        if (!formData.videoFile) {
          toast.error('Please select a video file');
          setUploading(false);
          return;
        }
        data.append('video', formData.videoFile);
      }

      const loadingToast = toast.loading(
        formData.type === 'upload' 
          ? 'Uploading video to cloud storage...' 
          : 'Adding video testimonial...'
      );

      const response = await api.post('/video-testimonials', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success('Video testimonial added successfully!');
        setVideoTestimonials(prev => [response.data.videoTestimonial, ...prev]);
        setShowAddModal(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Error adding video testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to add video testimonial');
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const response = await api.put(`/video-testimonials/${editData.id}`, {
        title: editData.title,
        studentName: editData.studentName,
        course: editData.course,
        isActive: editData.isActive,
        order: editData.order,
        duration: editData.duration
      });

      if (response.data.success) {
        toast.success('Video testimonial updated successfully!');
        setVideoTestimonials(prev => 
          prev.map(vt => vt._id === editData.id ? response.data.videoTestimonial : vt)
        );
        setShowEditModal(false);
        setEditData({
          id: '',
          title: '',
          studentName: '',
          course: '',
          isActive: true,
          order: 0,
          duration: ''
        });
      }
    } catch (error) {
      console.error('Error updating video testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to update video testimonial');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/video-testimonials/${id}`);
      
      if (response.data.success) {
        toast.success('Video testimonial deleted successfully!');
        setVideoTestimonials(prev => prev.filter(vt => vt._id !== id));
        setShowDeleteAlert(null);
      }
    } catch (error) {
      console.error('Error deleting video testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to delete video testimonial');
    }
  };

  const openEditModal = (vt) => {
    setEditData({
      id: vt._id,
      title: vt.title,
      studentName: vt.studentName,
      course: vt.course || '',
      isActive: vt.isActive,
      order: vt.order,
      duration: vt.duration || ''
    });
    setShowEditModal(true);
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      studentName: '',
      course: '',
      type: 'youtube',
      youtubeUrl: '',
      videoFile: null,
      duration: '',
      order: 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiVideo className="text-purple-500" />
            Manage Video Testimonials
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Video Testimonial
          </button>
        </div>

        <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Total Video Testimonials: <span className="font-bold text-neon-blue">{videoTestimonials.length}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoTestimonials.map((vt) => (
            <motion.div
              key={vt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Video Preview */}
              <div className="relative pt-[56.25%] bg-gray-900">
                {vt.type === 'youtube' ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(vt.youtubeUrl)}`}
                    title={vt.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    src={vt.videoUrl}
                    controls
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                    {vt.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    vt.isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {vt.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-semibold">Student:</span> {vt.studentName}
                </p>

                {vt.course && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-semibold">Course:</span> {vt.course}
                  </p>
                )}

                {vt.duration && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-semibold">Duration:</span> {vt.duration}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  {vt.type === 'youtube' ? (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded flex items-center gap-1">
                      <FiYoutube /> YouTube
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded flex items-center gap-1">
                      <FiUpload /> Uploaded
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Order: {vt.order}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(vt)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteAlert(vt._id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {videoTestimonials.length === 0 && (
          <div className="text-center py-12">
            <FiVideo className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No video testimonials yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
            >
              Add Your First Video Testimonial
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Video Testimonial</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                  type="button"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="youtube"
                        checked={formData.type === 'youtube'}
                        onChange={handleInputChange}
                        className="text-neon-blue focus:ring-neon-blue"
                      />
                      <span className="text-gray-900 dark:text-white flex items-center gap-2">
                        <FiYoutube className="text-red-500" /> YouTube Link
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="upload"
                        checked={formData.type === 'upload'}
                        onChange={handleInputChange}
                        className="text-neon-blue focus:ring-neon-blue"
                      />
                      <span className="text-gray-900 dark:text-white flex items-center gap-2">
                        <FiUpload className="text-blue-500" /> Upload Video
                      </span>
                    </label>
                  </div>
                </div>

                {/* YouTube URL or Video Upload */}
                {formData.type === 'youtube' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      YouTube URL *
                    </label>
                    <input
                      type="url"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleInputChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                      required
                    />
                    {getYouTubeVideoId(formData.youtubeUrl) && (
                      <div className="mt-3 relative rounded-lg overflow-hidden">
                        <div className="relative pt-[56.25%]">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(formData.youtubeUrl)}`}
                            title="Preview"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Video * (Max 100MB)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                      required
                    />
                    {formData.videoFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: {formData.videoFile.name} ({(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Amazing Learning Experience"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course (Optional)
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    placeholder="e.g., Web Development Bootcamp"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (Optional)
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2:30"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 px-6 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                      {formData.type === 'upload' ? 'Uploading...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Add Video Testimonial
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Video Testimonial</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                  type="button"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={editData.studentName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={editData.course}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={editData.duration}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={editData.order}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editData.isActive}
                    onChange={handleEditInputChange}
                    className="w-5 h-5 text-neon-blue focus:ring-neon-blue rounded"
                  />
                  <label className="text-gray-700 dark:text-gray-300">
                    Active (Show on website)
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 px-6 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Update Video Testimonial
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {showDeleteAlert && (
        <CustomAlert
          title="Delete Video Testimonial"
          message="Are you sure you want to delete this video testimonial? This action cannot be undone."
          type="danger"
          onConfirm={() => handleDelete(showDeleteAlert)}
          onClose={() => setShowDeleteAlert(null)}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default ManageVideoTestimonials;

