import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiPlus, FiEdit2, FiTrash2, FiStar, FiEye, FiEyeOff, FiSave, FiX, FiLock } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CustomAlert from '../../components/CustomAlert';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const hasFetched = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    isFeatured: false,
    order: 0
  });

  const [editData, setEditData] = useState({
    id: '',
    name: '',
    description: '',
    icon: '',
    isFeatured: false,
    order: 0,
    isActive: true,
    isSystemCategory: false
  });

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCategories();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/all');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.post('/categories', formData);

      if (response.data.success) {
        toast.success('Category created successfully!');
        setCategories(prev => [...prev, response.data.category]);
        setShowAddModal(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put(`/categories/${editData.id}`, {
        name: editData.name,
        description: editData.description,
        icon: editData.icon,
        isFeatured: editData.isFeatured,
        order: editData.order,
        isActive: editData.isActive
      });

      if (response.data.success) {
        toast.success('Category updated successfully!');
        setCategories(prev => 
          prev.map(cat => cat._id === editData.id ? response.data.category : cat)
        );
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setCategories(prev => prev.filter(cat => cat._id !== id));
        setShowDeleteAlert(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const openEditModal = (category) => {
    setEditData({
      id: category._id,
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      isFeatured: category.isFeatured,
      order: category.order,
      isActive: category.isActive,
      isSystemCategory: category.isSystemCategory
    });
    setShowEditModal(true);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      isFeatured: false,
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

  const regularCategories = categories.filter(cat => !cat.isSystemCategory);
  const systemCategories = categories.filter(cat => cat.isSystemCategory);

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiFolder className="text-purple-500" />
            Manage Categories
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Total Categories: <span className="font-bold text-neon-blue">{regularCategories.length}</span>
            {" | "}
            Featured: <span className="font-bold text-yellow-500">{regularCategories.filter(c => c.isFeatured).length}</span>
          </p>
        </div>

        {/* Regular Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {regularCategories.map((category) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      {category.isFeatured && (
                        <FiStar className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ml-2 ${
                    category.isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {category.icon && (
                    <span className="text-2xl">{category.icon}</span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    Order: {category.order}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteAlert(category._id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {regularCategories.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-8">
            <FiFolder className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No categories yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
            >
              Add Your First Category
            </button>
          </div>
        )}

        {/* System Categories */}
        {systemCategories.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiLock className="text-gray-500" />
              System Categories (Cannot be deleted or featured)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemCategories.map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-100 dark:bg-dark-surface rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FiLock className="w-4 h-4 text-gray-500" />
                          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                      This is a system category and cannot be deleted. Courses assigned to deleted categories are automatically moved here.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Category</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                  type="button"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Web Development"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this category"
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon/Emoji (Optional)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="e.g., 💻 🎨 📱"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

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

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-neon-blue focus:ring-neon-blue rounded"
                  />
                  <label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiStar className="text-yellow-500" />
                    Mark as Featured (Show on homepage)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-6 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Add Category
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Category</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
                  type="button"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditInputChange}
                    disabled={editData.isSystemCategory}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {editData.isSystemCategory && (
                    <p className="text-xs text-gray-500 mt-1">System category name cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon/Emoji
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={editData.icon}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  />
                </div>

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

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={editData.isFeatured}
                    onChange={handleEditInputChange}
                    disabled={editData.isSystemCategory}
                    className="w-5 h-5 text-neon-blue focus:ring-neon-blue rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiStar className="text-yellow-500" />
                    Mark as Featured
                  </label>
                  {editData.isSystemCategory && (
                    <span className="text-xs text-gray-500">(System categories cannot be featured)</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editData.isActive}
                    onChange={handleEditInputChange}
                    className="w-5 h-5 text-neon-blue focus:ring-neon-blue rounded"
                  />
                  <label className="text-gray-700 dark:text-gray-300">
                    Active (Visible on website)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-6 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Update Category
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
          title="Delete Category"
          message="Are you sure you want to delete this category? All courses in this category will be automatically moved to 'Other' category. This action cannot be undone."
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

export default ManageCategories;

