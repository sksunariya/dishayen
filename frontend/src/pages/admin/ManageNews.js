import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiLink, FiFileText } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ManageNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get('/news/all');
      setNews(response.data.news);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      title: '',
      link: '',
      description: '',
      order: news.length,
      isActive: true
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  const handleEdit = (newsItem) => {
    setFormData({
      title: newsItem.title || '',
      link: newsItem.link || '',
      description: newsItem.description || '',
      order: newsItem.order || 0,
      isActive: newsItem.isActive !== undefined ? newsItem.isActive : true
    });
    setEditingId(newsItem._id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      link: '',
      description: '',
      order: 0,
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a news title');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/news/${editingId}`, formData);
        toast.success('News updated successfully');
      } else {
        await api.post('/news', formData);
        toast.success('News added successfully');
      }
      fetchNews();
      handleCancel();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error(error.response?.data?.message || 'Failed to save news');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news item?')) {
      return;
    }

    try {
      await api.delete(`/news/${id}`);
      toast.success('News deleted successfully');
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Failed to delete news');
    }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold gradient-text">Manage News</h1>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add News
            </button>
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingId ? 'Edit News' : 'Add News'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      News Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter news title..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <FiLink className="w-4 h-4" />
                      Link URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://example.com (leave empty for no link)"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      If provided, the news title will be clickable and open in a new tab
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <FiFileText className="w-4 h-4" />
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter news description..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                      >
                        <option value={true}>Active</option>
                        <option value={false}>Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center gap-2"
                    >
                      <FiSave className="w-5 h-5" />
                      {editingId ? 'Update News' : 'Add News'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
                    >
                      <FiX className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* News List */}
          {news.length === 0 ? (
            <div className="bg-white dark:bg-dark-elevated p-12 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg text-center">
              <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No news items yet. Click "Add News" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((newsItem) => (
                <motion.div
                  key={newsItem._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-dark-border px-2 py-1 rounded">
                          Order: {newsItem.order}
                        </span>
                        {newsItem.isActive ? (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-border px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                        {newsItem.link && (
                          <span className="text-xs text-neon-blue flex items-center gap-1">
                            <FiLink className="w-3 h-3" />
                            Has Link
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {newsItem.link ? (
                          <a
                            href={newsItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-neon-blue transition-colors underline"
                          >
                            {newsItem.title}
                          </a>
                        ) : (
                          newsItem.title
                        )}
                      </h3>
                      {newsItem.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{newsItem.description}</p>
                      )}
                      {newsItem.link && (
                        <a
                          href={newsItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neon-blue hover:underline"
                        >
                          {newsItem.link}
                        </a>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Created: {new Date(newsItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(newsItem)}
                        className="p-2 text-neon-blue hover:bg-blue-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(newsItem._id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ManageNews;

