import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBook, FiPlus, FiEdit, FiArchive, FiDollarSign,
  FiUsers, FiStar, FiClock, FiX, FiSave, FiUpload,
  FiImage, FiRotateCcw, FiFilter, FiGrid, FiList, FiType,
  FiAlignLeft, FiEye
} from 'react-icons/fi';
import api, { getImageUrl } from '../../utils/api';
import toast from 'react-hot-toast';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active'); // 'active' or 'archived'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    duration: '',
    instructor: '',
    level: 'Beginner',
    category: '',
    requirements: '',
    whatYouWillLearn: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/all');
      setCategories(response.data.categories);
      // Set default category if none selected
      if (!formData.category && response.data.categories.length > 0) {
        const nonSystemCategory = response.data.categories.find(c => !c.isSystemCategory);
        if (nonSystemCategory) {
          setFormData(prev => ({ ...prev, category: nonSystemCategory._id }));
        }
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const archived = filterStatus === 'archived' ? 'true' : 'false';
      const response = await api.get(`/admin/courses/all?archived=${archived}`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Fetch courses error:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const formDataObj = new FormData();
      
      // Add thumbnail if selected
      if (selectedFile) {
        formDataObj.append('thumbnail', selectedFile);
        // Show toast for long upload
        toast.loading('Uploading image to cloud storage...', { id: 'upload-progress' });
      }
      
      // Add all form fields
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('shortDescription', formData.shortDescription);
      formDataObj.append('price', formData.price);
      formDataObj.append('duration', formData.duration);
      formDataObj.append('instructor', formData.instructor);
      formDataObj.append('level', formData.level);
      formDataObj.append('category', formData.category);
      
      // Parse and add arrays
      const requirements = formData.requirements.split('\n').filter(r => r.trim());
      const whatYouWillLearn = formData.whatYouWillLearn.split('\n').filter(w => w.trim());
      
      requirements.forEach((req, index) => {
        formDataObj.append(`requirements[${index}]`, req);
      });
      
      whatYouWillLearn.forEach((item, index) => {
        formDataObj.append(`whatYouWillLearn[${index}]`, item);
      });

      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse._id}`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.dismiss('upload-progress');
        toast.success('Course updated successfully');
      } else {
        await api.post('/admin/courses', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.dismiss('upload-progress');
        toast.success('Course created successfully');
      }

      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Save course error:', error);
      toast.dismiss('upload-progress');
      
      // Show more specific error messages
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save course';
      if (errorMessage.includes('cloud storage')) {
        toast.error('Image upload failed. Please try with a smaller image or check your connection.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Upload timeout. Please try with a smaller image.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleArchive = async (courseId) => {
    if (!window.confirm('Are you sure you want to archive this course? It will be hidden from students.')) return;

    try {
      await api.patch(`/admin/courses/${courseId}/archive`);
      toast.success('Course archived successfully');
      fetchCourses();
    } catch (error) {
      console.error('Archive course error:', error);
      toast.error('Failed to archive course');
    }
  };

  const handleRestore = async (courseId) => {
    try {
      await api.patch(`/admin/courses/${courseId}/restore`);
      toast.success('Course restored successfully');
      fetchCourses();
    } catch (error) {
      console.error('Restore course error:', error);
      toast.error('Failed to restore course');
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription || '',
      price: course.price.toString(),
      duration: course.duration,
      instructor: course.instructor,
      level: course.level,
      category: typeof course.category === 'object' ? course.category._id : course.category,
      requirements: course.requirements?.join('\n') || '',
      whatYouWillLearn: course.whatYouWillLearn?.join('\n') || ''
    });
    setPreviewUrl(getImageUrl(course.image));
    setShowModal(true);
  };

  const resetForm = () => {
    const defaultCategory = categories.find(c => !c.isSystemCategory)?._id || '';
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      price: '',
      duration: '',
      instructor: '',
      level: 'Beginner',
      category: defaultCategory,
      requirements: '',
      whatYouWillLearn: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const activeCourses = courses.filter(c => !c.archived);
  const archivedCourses = courses.filter(c => c.archived);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <FiBook className="w-8 h-8 text-white" />
                </div>
                Course Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Create, edit, and manage courses • {activeCourses.length} active • {archivedCourses.length} archived
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white dark:bg-dark-elevated rounded-xl p-1 shadow-md border border-gray-200 dark:border-dark-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setEditingCourse(null);
                  setShowModal(true);
                }}
                className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <FiPlus className="w-5 h-5" />
                <span className="font-bold">Add New Course</span>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                filterStatus === 'active'
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <FiFilter className="w-5 h-5" />
              Active Courses ({activeCourses.length})
            </button>
            <button
              onClick={() => setFilterStatus('archived')}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                filterStatus === 'archived'
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <FiArchive className="w-5 h-5" />
              Archived Courses ({archivedCourses.length})
            </button>
          </div>

          {/* Courses Grid/List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-blue border-t-transparent"></div>
            </div>
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-3xl p-20 text-center border-2 border-dashed border-gray-300 dark:border-dark-border"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <FiBook className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {filterStatus === 'archived' ? 'No archived courses' : 'No courses yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                {filterStatus === 'archived' 
                  ? 'Archived courses will appear here'
                  : 'Get started by creating your first course'}
              </p>
              {filterStatus === 'active' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                >
                  <FiPlus className="w-6 h-6" />
                  Create First Course
                </button>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-dark-border"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(course.image)}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {course.archived && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                        Archived
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {course.shortDescription || course.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiDollarSign className="text-green-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{course.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiUsers className="text-neon-blue" />
                        {course.enrolledStudents || 0} enrolled
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiStar className="text-yellow-500" />
                        {course.averageRating?.toFixed(1) || 'N/A'} rating
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiClock className="text-purple-500" />
                        {course.duration}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full capitalize">
                        {course.level}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                        {typeof course.category === 'object' ? course.category.name : course.category}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                      <button
                        onClick={() => openEditModal(course)}
                        className="flex-1 p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <FiEdit className="w-4 h-4" />
                        Edit
                      </button>
                      {course.archived ? (
                        <button
                          onClick={() => handleRestore(course._id)}
                          className="flex-1 p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <FiRotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(course._id)}
                          className="flex-1 p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <FiArchive className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-dark-border"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-64 flex-shrink-0">
                      <div className="relative h-48 md:h-full rounded-xl overflow-hidden group">
                        <img
                          src={getImageUrl(course.image)}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {course.archived && (
                          <div className="absolute top-3 left-3 px-3 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                            Archived
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {course.shortDescription || course.description.substring(0, 200)}...
                        </p>
                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FiDollarSign className="text-green-500" />
                            <span className="font-bold text-gray-900 dark:text-white">₹{course.price.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FiUsers className="text-neon-blue" />
                            {course.enrolledStudents || 0} enrolled
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FiStar className="text-yellow-500" />
                            {course.averageRating?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FiClock className="text-purple-500" />
                            {course.duration}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => openEditModal(course)}
                          className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors font-semibold flex items-center gap-2"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                        {course.archived ? (
                          <button
                            onClick={() => handleRestore(course._id)}
                            className="px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors font-semibold flex items-center gap-2"
                          >
                            <FiRotateCcw className="w-4 h-4" />
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(course._id)}
                            className="px-4 py-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors font-semibold flex items-center gap-2"
                          >
                            <FiArchive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Course Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModal(false);
              setEditingCourse(null);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-3xl p-8 max-w-5xl w-full my-8 border-2 border-blue-200 dark:border-blue-500/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <FiBook className="w-6 h-6 text-white" />
                  </div>
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourse(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto px-2">
                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <FiImage className="text-blue-500" />
                    Course Thumbnail * <span className="text-xs font-normal text-gray-500">(800x600px recommended, max 10MB)</span>
                  </label>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Upload Area */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                          dragOver
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-105'
                            : 'border-gray-300 dark:border-dark-border bg-gradient-to-br from-gray-50 to-white dark:from-dark-elevated dark:to-dark-surface hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                        <div className="relative">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FiUpload className="w-10 h-10 text-white" />
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-bold text-lg mb-2">
                            {selectedFile ? selectedFile.name : dragOver ? 'Drop image here!' : 'Click or drag to upload'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF, WEBP up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <FiEye className="text-blue-500" /> Preview
                        </p>
                        <div className="relative rounded-2xl overflow-hidden border-3 border-gray-200 dark:border-dark-border shadow-xl group">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {selectedFile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (!editingCourse) {
                                  setPreviewUrl('');
                                } else {
                                  setPreviewUrl(getImageUrl(editingCourse.image));
                                }
                              }}
                              className="absolute top-3 right-3 p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg hover:scale-110"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  {!previewUrl && !editingCourse && (
                    <p className="text-sm text-red-500 mt-2 font-semibold">* Thumbnail is required for new courses</p>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <FiType className="text-blue-500" />
                      Course Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      maxLength={200}
                      className="input-field w-full text-lg font-semibold"
                      placeholder="e.g., Complete Web Development Bootcamp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Instructor Name *
                    </label>
                    <input
                      type="text"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      required
                      className="input-field w-full"
                      placeholder="e.g., John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FiAlignLeft className="text-blue-500" />
                    Short Description * <span className="text-xs font-normal text-gray-500">(Shown in course cards)</span>
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    required
                    maxLength={300}
                    rows={2}
                    className="input-field w-full resize-none"
                    placeholder="Brief description that appears on course cards..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.shortDescription.length}/300 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Full Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    maxLength={2000}
                    rows={5}
                    className="input-field w-full resize-none"
                    placeholder="Comprehensive course description..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="input-field w-full text-lg font-bold"
                      placeholder="4999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 8 weeks, 40 hours"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Difficulty Level *
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.filter(cat => !cat.isSystemCategory).map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.icon && `${category.icon} `}{category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Requirements <span className="text-xs font-normal text-gray-500">(One per line)</span>
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="Basic programming knowledge&#10;Computer with internet connection&#10;Text editor installed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    What Students Will Learn <span className="text-xs font-normal text-gray-500">(One per line)</span>
                  </label>
                  <textarea
                    name="whatYouWillLearn"
                    value={formData.whatYouWillLearn}
                    onChange={handleChange}
                    rows={4}
                    className="input-field w-full resize-none"
                    placeholder="Build modern web applications&#10;Master React fundamentals&#10;Deploy applications to production&#10;Work with databases"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-elevated">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCourse(null);
                    }}
                    disabled={uploading}
                    className="flex-1 py-4 px-6 bg-white dark:bg-dark-elevated border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                  >
                    <FiX className="w-6 h-6" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || (!selectedFile && !editingCourse && !previewUrl)}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                        {editingCourse ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FiSave className="w-6 h-6" />
                        {editingCourse ? 'Update Course' : 'Create Course'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCourses;
