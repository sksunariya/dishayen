import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiCheck, FiX, FiUpload, FiEye, FiLink, FiType, FiAlignLeft, FiGrid, FiList, FiZap, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import api, { getImageUrl } from '../../utils/api';
import toast from 'react-hot-toast';

const ManageCarousel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkUrl: '',
    order: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await api.get('/carousel/all');
      setImages(response.data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load carousel images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    // Create preview URL
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId && !selectedFile) {
      toast.error('Please select an image');
      return;
    }

    // Validate order number
    const maxOrder = images.length;
    if (!editingId && formData.order > maxOrder) {
      toast.error(`Order cannot be greater than ${maxOrder}. Maximum order for new items is ${maxOrder}.`);
      return;
    }

    if (editingId && formData.order > maxOrder - 1) {
      toast.error(`Order cannot be greater than ${maxOrder - 1}. Maximum order is ${maxOrder - 1}.`);
      return;
    }

    setUploading(true);

    try {
      const formDataObj = new FormData();
      
      if (selectedFile) {
        formDataObj.append('image', selectedFile);
      }
      
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('linkUrl', formData.linkUrl);
      formDataObj.append('order', formData.order.toString());

      if (editingId) {
        const oldImage = images.find(img => img._id === editingId);
        const oldOrder = oldImage?.order;
        const newOrder = formData.order;

        // Update the image first
        await api.put(`/carousel/${editingId}`, formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // If order changed, reorder other images in a single batch call
        if (oldOrder !== newOrder) {
          const updates = calculateReorderUpdates(editingId, oldOrder, newOrder);
          if (updates.length > 0) {
            await api.patch('/carousel/batch-update-order', { updates });
          }
        }

        toast.success('Carousel image updated successfully!');
      } else {
        // For new images, if order conflicts with existing, shift others
        const conflictingImage = images.find(img => img.order === formData.order);
        if (conflictingImage) {
          // Calculate updates for shifting images
          const updates = images
            .filter(img => img.order >= formData.order)
            .map(img => ({ id: img._id, order: img.order + 1 }));
          
          if (updates.length > 0) {
            await api.patch('/carousel/batch-update-order', { updates });
          }
        }

        await api.post('/carousel', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Carousel image added successfully!');
      }
      
      resetForm();
      fetchImages();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save image');
    } finally {
      setUploading(false);
    }
  };

  const calculateReorderUpdates = (changedId, oldOrder, newOrder) => {
    const updates = [];

    if (newOrder < oldOrder) {
      // Moving up (lower order number)
      // Shift images between newOrder and oldOrder down by 1
      images.forEach(img => {
        if (img._id !== changedId && img.order >= newOrder && img.order < oldOrder) {
          updates.push({ id: img._id, order: img.order + 1 });
        }
      });
    } else {
      // Moving down (higher order number)
      // Shift images between oldOrder and newOrder up by 1
      images.forEach(img => {
        if (img._id !== changedId && img.order > oldOrder && img.order <= newOrder) {
          updates.push({ id: img._id, order: img.order - 1 });
        }
      });
    }

    return updates;
  };

  const handleEdit = (image) => {
    setFormData({
      title: image.title,
      description: image.description || '',
      linkUrl: image.linkUrl || '',
      order: image.order
    });
    setPreviewUrl(getImageUrl(image.imageUrl));
    setEditingId(image._id);
    setShowAddForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this carousel image?')) return;

    try {
      const imageToDelete = images.find(img => img._id === id);
      const deletedOrder = imageToDelete?.order;

      await api.delete(`/carousel/${id}`);
      
      // Reorder remaining images after deletion in a single batch call
      if (deletedOrder !== undefined) {
        const updates = images
          .filter(img => img.order > deletedOrder)
          .map(img => ({ id: img._id, order: img.order - 1 }));
        
        if (updates.length > 0) {
          await api.patch('/carousel/batch-update-order', { updates });
        }
      }

      toast.success('Carousel image deleted successfully!');
      fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/carousel/${id}`, { isActive: !currentStatus });
      toast.success(`Carousel image ${!currentStatus ? 'activated' : 'deactivated'}!`);
      fetchImages();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error('Failed to update status');
    }
  };

  const moveImage = async (id, direction) => {
    const currentIndex = images.findIndex(img => img._id === id);
    if (currentIndex === -1) return;

    const currentImage = images[currentIndex];
    let targetIndex;

    if (direction === 'up') {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        toast.error('Image is already at the top');
        return;
      }
    } else {
      targetIndex = currentIndex + 1;
      if (targetIndex >= images.length) {
        toast.error('Image is already at the bottom');
        return;
      }
    }

    const targetImage = images[targetIndex];

    try {
      // Swap orders in a single batch call
      const updates = [
        { id: currentImage._id, order: targetImage.order },
        { id: targetImage._id, order: currentImage.order }
      ];

      await api.patch('/carousel/batch-update-order', { updates });
      
      toast.success('Order updated successfully!');
      fetchImages();
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Failed to update order');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      linkUrl: '',
      order: images.length
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

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
                  <FiImage className="w-8 h-8 text-white" />
                </div>
                Carousel Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Upload and manage homepage carousel images • {images.length} total images
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
                  title="Grid View"
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
                  title="List View"
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (!showAddForm) {
                    setFormData({ ...formData, order: images.length });
                  }
                }}
                className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {showAddForm ? <FiX className="w-5 h-5" /> : <FiPlus className="w-5 h-5" />}
                <span className="font-bold">{showAddForm ? 'Cancel' : 'Add New Image'}</span>
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <div className="glass-effect p-8 rounded-3xl border-2 border-blue-200 dark:border-blue-500/30 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <FiZap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {editingId ? 'Edit Carousel Image' : 'Add New Carousel Image'}
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload Area */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <FiImage className="text-blue-500" />
                        Carousel Image * <span className="text-xs font-normal text-gray-500">(1920x1080px recommended, max 10MB)</span>
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
                              <FiEye className="text-blue-500" /> Live Preview
                            </p>
                            <div className="relative rounded-2xl overflow-hidden border-3 border-gray-200 dark:border-dark-border shadow-xl group">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                  setPreviewUrl('');
                                }}
                                className="absolute top-3 right-3 p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg hover:scale-110"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <FiType className="text-blue-500" />
                          Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="input-field w-full text-lg font-semibold"
                          placeholder="e.g., Transform Your Future"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <FiLink className="text-blue-500" />
                          Link URL <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.linkUrl}
                          onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                          placeholder="/courses or https://example.com"
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FiAlignLeft className="text-blue-500" />
                        Description <span className="text-xs font-normal text-gray-500">(Optional)</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        maxLength={200}
                        rows={4}
                        className="input-field w-full resize-none"
                        placeholder="Brief description for the carousel slide..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.description.length}/200 characters
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          Display Order *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.order}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const maxOrder = editingId ? images.length - 1 : images.length;
                            if (value < 0) {
                              setFormData({ ...formData, order: 0 });
                            } else if (value > maxOrder) {
                              setFormData({ ...formData, order: maxOrder });
                              toast.error(`Maximum order is ${maxOrder}`);
                            } else {
                              setFormData({ ...formData, order: value });
                            }
                          }}
                          className="input-field w-full text-lg font-bold"
                          min="0"
                          max={editingId ? images.length - 1 : images.length}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Lower numbers appear first • Range: 0 to {editingId ? images.length - 1 : images.length}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-dark-border">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload className="w-6 h-6" />
                            {editingId ? 'Update Image' : 'Upload Image'}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={uploading}
                        className="flex-1 py-4 px-6 bg-white dark:bg-dark-elevated border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                      >
                        <FiX className="w-6 h-6" />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Images Grid/List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="spinner mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">Loading carousel images...</p>
            </div>
          ) : images.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-3xl p-20 text-center border-2 border-dashed border-gray-300 dark:border-dark-border"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <FiImage className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">No carousel images yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Add your first carousel image to get started with your homepage showcase</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                <FiPlus className="w-6 h-6" />
                Add First Image
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-dark-border flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                      image.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {image.isActive ? '● Active' : '● Inactive'}
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg">
                      #{image.order}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {image.title}
                    </h3>
                    
                    {/* Fixed height description area */}
                    <div className="h-20 mb-3">
                      {image.description ? (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                          {image.description}
                        </p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                          No description
                        </p>
                      )}
                    </div>

                    {/* Fixed height link area */}
                    <div className="h-6 mb-4">
                      {image.linkUrl && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <FiLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{image.linkUrl}</span>
                        </div>
                      )}
                    </div>

                    {/* Spacer to push actions to bottom */}
                    <div className="flex-grow"></div>

                    {/* Action Buttons - Always at bottom */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                      {/* Move Up/Down */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveImage(image._id, 'up')}
                          disabled={index === 0}
                          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveImage(image._id, 'down')}
                          disabled={index === images.length - 1}
                          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => toggleActive(image._id, image.isActive)}
                        className={`flex-1 p-2 rounded-lg transition-colors font-semibold text-sm ${
                          image.isActive
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30'
                            : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                        }`}
                        title={image.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {image.isActive ? <FiX className="inline mr-1" /> : <FiCheck className="inline mr-1" />}
                        {image.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleEdit(image)}
                        className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(image._id)}
                        className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {images.map((image, index) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-2xl p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-dark-border"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="md:w-80 flex-shrink-0">
                      <div className="relative h-48 md:h-full rounded-xl overflow-hidden group">
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={image.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                          image.isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {image.isActive ? '● Active' : '● Inactive'}
                        </div>
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg">
                          Order: {image.order}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {image.title}
                        </h3>
                        {image.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {image.description}
                          </p>
                        )}
                        {image.linkUrl && (
                          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <FiLink className="w-4 h-4" />
                            <span className="truncate">{image.linkUrl}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => moveImage(image._id, 'up')}
                            disabled={index === 0}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FiArrowUp className="w-4 h-4" />
                            Move Up
                          </button>
                          <button
                            onClick={() => moveImage(image._id, 'down')}
                            disabled={index === images.length - 1}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FiArrowDown className="w-4 h-4" />
                            Move Down
                          </button>
                        </div>

                        <button
                          onClick={() => toggleActive(image._id, image.isActive)}
                          className={`px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 ${
                            image.isActive
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30'
                              : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                          }`}
                        >
                          {image.isActive ? <><FiX className="w-4 h-4" /> Hide</> : <><FiCheck className="w-4 h-4" /> Show</>}
                        </button>
                        <button
                          onClick={() => handleEdit(image)}
                          className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors font-semibold flex items-center gap-2"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(image._id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors font-semibold flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
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

export default ManageCarousel;
