import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBook, FiPlus, FiEdit, FiArchive, FiLink,
  FiRotateCcw, FiFilter, FiGrid, FiList, FiX, FiSave,
  FiEye, FiRefreshCw, FiStar, FiExternalLink
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [viewMode, setViewMode] = useState('grid');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    url: '',
    title: '',
    image: '',
    category: '',
    featured: false
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [filterStatus]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/all');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Fetch categories error:', error);
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

  const handleFetchMetadata = async () => {
    if (!formData.url.trim()) {
      toast.error('Please enter a course URL first');
      return;
    }
    setFetching(true);
    try {
      const response = await api.post('/admin/courses/fetch-metadata', { url: formData.url.trim() });
      const { title, image } = response.data;
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        image: image || prev.image
      }));
      if (title || image) {
        toast.success('Preview fetched successfully');
      } else {
        toast('Could not extract title/image from the page — please fill in manually', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Fetch metadata error:', error);
      toast.error('Failed to fetch preview from URL');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.url.trim()) return toast.error('Course URL is required');
    if (!formData.title.trim()) return toast.error('Course title is required');

    setSaving(true);
    try {
      const payload = {
        url: formData.url.trim(),
        title: formData.title.trim(),
        image: formData.image.trim() || undefined,
        category: formData.category || undefined,
        featured: formData.featured
      };

      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse._id}`, payload);
        toast.success('Course updated successfully');
      } else {
        await api.post('/admin/courses', payload);
        toast.success('Course created successfully');
      }

      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Save course error:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (courseId) => {
    if (!window.confirm('Archive this course? It will be hidden from students.')) return;
    try {
      await api.patch(`/admin/courses/${courseId}/archive`);
      toast.success('Course archived');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to archive course');
    }
  };

  const handleRestore = async (courseId) => {
    try {
      await api.patch(`/admin/courses/${courseId}/restore`);
      toast.success('Course restored');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to restore course');
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      url: course.url || '',
      title: course.title || '',
      image: course.image || '',
      category: typeof course.category === 'object' ? course.category?._id || '' : course.category || '',
      featured: course.featured || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ url: '', title: '', image: '', category: '', featured: false });
  };

  const activeCourses = courses.filter(c => !c.archived);
  const archivedCourses = courses.filter(c => c.archived);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

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
                Add course links • {activeCourses.length} active • {archivedCourses.length} archived
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-white dark:bg-dark-elevated rounded-xl p-1 shadow-md border border-gray-200 dark:border-dark-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'}`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => { resetForm(); setEditingCourse(null); setShowModal(true); }}
                className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <FiPlus className="w-5 h-5" />
                <span className="font-bold">Add Course</span>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex gap-3">
            {['active', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  filterStatus === status
                    ? 'bg-gradient-primary text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-500'
                }`}
              >
                {status === 'active' ? <FiFilter className="w-5 h-5" /> : <FiArchive className="w-5 h-5" />}
                {status === 'active' ? `Active (${activeCourses.length})` : `Archived (${archivedCourses.length})`}
              </button>
            ))}
          </div>

          {/* Courses */}
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
                {filterStatus === 'archived' ? 'Archived courses will appear here' : 'Add your first course link to get started'}
              </p>
              {filterStatus === 'active' && (
                <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                  <FiPlus className="w-6 h-6" />
                  Add First Course
                </button>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-dark-border"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={course.image || 'https://via.placeholder.com/800x600?text=Course'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {course.archived && (
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                        Archived
                      </div>
                    )}
                    {course.featured && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 bg-yellow-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <FiStar className="w-3 h-3" /> Featured
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>

                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mb-3 truncate"
                    >
                      <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{course.url}</span>
                    </a>

                    {course.category && (
                      <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full mb-3">
                        {typeof course.category === 'object' ? course.category.name : course.category}
                      </span>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-dark-border">
                      <button
                        onClick={() => openEditModal(course)}
                        className="flex-1 p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <FiEdit className="w-4 h-4" /> Edit
                      </button>
                      {course.archived ? (
                        <button
                          onClick={() => handleRestore(course._id)}
                          className="flex-1 p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <FiRotateCcw className="w-4 h-4" /> Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(course._id)}
                          className="flex-1 p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <FiArchive className="w-4 h-4" /> Archive
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
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
                    <div className="md:w-48 flex-shrink-0">
                      <div className="relative h-36 md:h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={course.image || 'https://via.placeholder.com/800x600?text=Course'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        {course.archived && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                            Archived
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h3>
                          {course.featured && (
                            <span className="flex-shrink-0 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
                              <FiStar className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-3"
                        >
                          <FiExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-md">{course.url}</span>
                        </a>
                        {course.category && (
                          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-full">
                            {typeof course.category === 'object' ? course.category.name : course.category}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => openEditModal(course)}
                          className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors font-semibold flex items-center gap-2"
                        >
                          <FiEdit className="w-4 h-4" /> Edit
                        </button>
                        {course.archived ? (
                          <button
                            onClick={() => handleRestore(course._id)}
                            className="px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors font-semibold flex items-center gap-2"
                          >
                            <FiRotateCcw className="w-4 h-4" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(course._id)}
                            className="px-4 py-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors font-semibold flex items-center gap-2"
                          >
                            <FiArchive className="w-4 h-4" /> Archive
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
            onClick={() => { setShowModal(false); setEditingCourse(null); }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-3xl p-8 max-w-2xl w-full my-8 border-2 border-blue-200 dark:border-blue-500/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <FiLink className="w-5 h-5 text-white" />
                  </div>
                  {editingCourse ? 'Edit Course' : 'Add Course Link'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditingCourse(null); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* URL input + Fetch button */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Course URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      required
                      className="input-field flex-1"
                      placeholder="https://example.courses.store/12345"
                    />
                    <button
                      type="button"
                      onClick={handleFetchMetadata}
                      disabled={fetching || !formData.url.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      {fetching ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Fetching...</>
                      ) : (
                        <><FiRefreshCw className="w-4 h-4" /> Fetch Preview</>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Paste the course URL, then click Fetch Preview to auto-fill title and thumbnail.</p>
                </div>

                {/* Image preview */}
                {formData.image && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FiEye className="text-blue-500" /> Thumbnail Preview
                    </label>
                    <div className="relative rounded-xl overflow-hidden h-48 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Image URL (editable) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail URL <span className="text-xs font-normal text-gray-500">(auto-filled or paste manually)</span>
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="https://..."
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
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
                    placeholder="Auto-filled from URL or enter manually"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-xs font-normal text-gray-500">(optional)</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="">No category</option>
                    {categories.filter(cat => !cat.isSystemCategory).map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.icon && `${category.icon} `}{category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-5 h-5 rounded accent-blue-600"
                  />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Mark as Featured</span>
                </label>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingCourse(null); }}
                    disabled={saving}
                    className="flex-1 py-3 px-6 bg-white dark:bg-dark-elevated border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FiX className="w-5 h-5" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Saving...</>
                    ) : (
                      <><FiSave className="w-5 h-5" /> {editingCourse ? 'Update Course' : 'Save Course'}</>
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
