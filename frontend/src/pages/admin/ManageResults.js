import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiImage, FiVideo, FiUpload, FiLink, FiPlus, FiEdit2, FiTrash2,
  FiX, FiSave, FiEye, FiEyeOff, FiGrid
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([^#&?]{11})/);
  return match ? match[1] : null;
};

const isYouTubeUrl = (url) => Boolean(getYouTubeId(url));

const EMPTY_FORM = {
  title: '',
  caption: '',
  mediaType: 'upload',   // 'upload' | 'link'
  fileType: 'image',     // 'image' | 'video'  (only used for 'link' — auto-detected for uploads)
  url: '',
  file: null,
  order: 0
};

const ManageResults = () => {
  const [results, setResults] = useState([]);
  const [gridCols, setGridCols] = useState(3);
  const [pendingGridCols, setPendingGridCols] = useState(3);
  const [loading, setLoading] = useState(true);
  const [savingGrid, setSavingGrid] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editData, setEditData] = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchResults();
    }
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/results/all');
      setResults(res.data.results);
      setGridCols(res.data.gridCols);
      setPendingGridCols(res.data.gridCols);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // ── Grid settings ──────────────────────────────────────────────────────────

  const handleSaveGrid = async () => {
    setSavingGrid(true);
    try {
      const res = await api.put('/results/settings', { gridCols: pendingGridCols });
      setGridCols(res.data.gridCols);
      toast.success('Grid size updated');
    } catch {
      toast.error('Failed to update grid size');
    } finally {
      setSavingGrid(false);
    }
  };

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${file.type.startsWith('video/') ? '100MB' : '10MB'}`);
      return;
    }
    setFormData(prev => ({ ...prev, file }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let loadingToast = null;
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('caption', formData.caption);
      data.append('mediaType', formData.mediaType);
      data.append('order', formData.order);

      if (formData.mediaType === 'upload') {
        if (!formData.file) { toast.error('Please select a file'); setUploading(false); return; }
        data.append('file', formData.file);
      } else {
        if (!formData.url) { toast.error('Please enter a URL'); setUploading(false); return; }
        data.append('url', formData.url);
        data.append('fileType', formData.fileType);
      }

      loadingToast = toast.loading(
        formData.mediaType === 'upload' ? 'Uploading to cloud storage…' : 'Adding result…'
      );
      const res = await api.post('/results', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Result added!');
        setResults(prev => [res.data.result, ...prev]);
        setShowAddModal(false);
        setFormData(EMPTY_FORM);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add result');
    } finally {
      if (loadingToast) toast.dismiss(loadingToast);
      setUploading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const openEditModal = (item) => {
    setEditData({
      id: item._id,
      title: item.title,
      caption: item.caption || '',
      isActive: item.isActive,
      order: item.order,
      mediaType: item.mediaType,
      fileType: item.fileType,
      url: item.mediaType === 'link' ? item.url : '',
      file: null
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const data = new FormData();
      data.append('title', editData.title);
      data.append('caption', editData.caption);
      data.append('order', editData.order);
      data.append('isActive', editData.isActive);

      if (editData.file) {
        data.append('file', editData.file);
      } else if (editData.mediaType === 'link' && editData.url) {
        data.append('url', editData.url);
      }

      const res = await api.put(`/results/${editData.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Result updated!');
        setResults(prev => prev.map(r => r._id === editData.id ? res.data.result : r));
        setShowEditModal(false);
        setEditData(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update result');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted');
      setResults(prev => prev.filter(r => r._id !== id));
      setShowDeleteAlert(null);
    } catch {
      toast.error('Failed to delete result');
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────

  const handleToggleActive = async (item) => {
    try {
      const data = new FormData();
      data.append('isActive', !item.isActive);
      const res = await api.put(`/results/${item._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setResults(prev => prev.map(r => r._id === item._id ? res.data.result : r));
        toast.success(res.data.result.isActive ? 'Marked active' : 'Marked inactive');
      }
    } catch {
      toast.error('Failed to update status');
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

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiGrid className="text-neon-blue" />
            Manage Results
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" /> Add Result
          </button>
        </div>

        {/* Grid size setting */}
        <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Grid Layout</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Columns:</span>
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setPendingGridCols(n)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                  pendingGridCols === n
                    ? 'border-neon-blue bg-neon-blue/10 text-neon-blue'
                    : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:border-neon-blue/50'
                }`}
              >
                {n} Columns
              </button>
            ))}
            <button
              onClick={handleSaveGrid}
              disabled={savingGrid || pendingGridCols === gridCols}
              className="px-5 py-2 bg-gradient-primary text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-neon transition-all flex items-center gap-2"
            >
              {savingGrid ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <FiSave />}
              Save
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-500">Current: {gridCols} columns</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Total: <span className="font-bold text-neon-blue">{results.length}</span>
            <span className="mx-3">·</span>
            Active: <span className="font-bold text-green-500">{results.filter(r => r.isActive).length}</span>
            <span className="mx-3">·</span>
            Images: <span className="font-bold text-purple-500">{results.filter(r => r.fileType === 'image').length}</span>
            <span className="mx-3">·</span>
            Videos: <span className="font-bold text-pink-500">{results.filter(r => r.fileType === 'video').length}</span>
          </p>
        </div>

        {/* Results grid */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <FiImage className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No results yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
            >
              Add Your First Result
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-dark-elevated rounded-xl border overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
                  item.isActive ? 'border-gray-200 dark:border-dark-border' : 'border-dashed border-gray-300 dark:border-gray-700 opacity-60'
                }`}
              >
                {/* Preview */}
                {item.fileType === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative pt-[56.25%] bg-gray-900">
                    {isYouTubeUrl(item.url) ? (
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}`}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        src={item.url}
                        controls
                        preload="metadata"
                      />
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 flex-1">{item.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                      item.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {item.caption && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{item.caption}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    {item.fileType === 'image'
                      ? <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded flex items-center gap-1"><FiImage className="w-3 h-3" /> Image</span>
                      : <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 rounded flex items-center gap-1"><FiVideo className="w-3 h-3" /> Video</span>
                    }
                    {item.mediaType === 'upload'
                      ? <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded flex items-center gap-1"><FiUpload className="w-3 h-3" /> Uploaded</span>
                      : <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded flex items-center gap-1"><FiLink className="w-3 h-3" /> Link</span>
                    }
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Order: {item.order}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      title={item.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {item.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <FiEdit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteAlert(item._id)}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <FiTrash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Result</h2>
                <button onClick={() => { setShowAddModal(false); setFormData(EMPTY_FORM); }} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors" type="button">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Source: Upload or Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source *</label>
                  <div className="flex gap-4">
                    {[
                      { val: 'upload', icon: <FiUpload />, label: 'Upload File' },
                      { val: 'link', icon: <FiLink />, label: 'External Link' }
                    ].map(({ val, icon, label }) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mediaType" value={val}
                          checked={formData.mediaType === val}
                          onChange={e => setFormData(prev => ({ ...prev, mediaType: e.target.value, file: null, url: '' }))}
                          className="text-neon-blue focus:ring-neon-blue"
                        />
                        <span className="text-gray-900 dark:text-white flex items-center gap-1 text-sm">{icon} {label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* File upload */}
                {formData.mediaType === 'upload' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File * <span className="text-xs text-gray-500">(Images: 10MB max · Videos: 100MB max)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white text-sm"
                      required
                    />
                    {formData.file && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.file.name} · {(formData.file.size / (1024 * 1024)).toFixed(2)} MB ·{' '}
                        {formData.file.type.startsWith('image/') ? 'Image' : 'Video'}
                      </p>
                    )}
                  </div>
                )}

                {/* Link input */}
                {formData.mediaType === 'link' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                      <div className="flex gap-4">
                        {[
                          { val: 'image', icon: <FiImage />, label: 'Image' },
                          { val: 'video', icon: <FiVideo />, label: 'Video / YouTube' }
                        ].map(({ val, icon, label }) => (
                          <label key={val} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="fileType" value={val}
                              checked={formData.fileType === val}
                              onChange={e => setFormData(prev => ({ ...prev, fileType: e.target.value }))}
                              className="text-neon-blue focus:ring-neon-blue"
                            />
                            <span className="text-gray-900 dark:text-white flex items-center gap-1 text-sm">{icon} {label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL *</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder={formData.fileType === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/image.jpg'}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                        required
                      />
                      {/* YouTube preview */}
                      {formData.fileType === 'video' && getYouTubeId(formData.url) && (
                        <div className="mt-3 relative pt-[56.25%] rounded-lg overflow-hidden">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${getYouTubeId(formData.url)}`}
                            title="Preview" frameBorder="0" allowFullScreen
                          />
                        </div>
                      )}
                      {/* Image link preview */}
                      {formData.fileType === 'image' && formData.url && (
                        <img src={formData.url} alt="preview" className="mt-3 w-full h-40 object-cover rounded-lg" onError={e => e.target.style.display = 'none'} />
                      )}
                    </div>
                  </>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Rank 1 in JEE Mains 2024"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                    required
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caption <span className="text-gray-400">(optional)</span></label>
                  <textarea
                    value={formData.caption}
                    onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Short description..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm resize-none"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData(prev => ({ ...prev, order: e.target.value }))}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Uploading…</>
                    : <><FiSave /> Add Result</>
                  }
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && editData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Result</h2>
                <button onClick={() => { setShowEditModal(false); setEditData(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors" type="button">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Replace file (upload type only) */}
                {editData.mediaType === 'upload' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Replace File <span className="text-gray-400 text-xs">(optional — leave empty to keep current)</span>
                    </label>
                    <input
                      type="file"
                      accept={editData.fileType === 'image' ? 'image/*' : 'video/*'}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
                        if (file.size > maxSize) { toast.error('File too large'); return; }
                        setEditData(prev => ({ ...prev, file }));
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white text-sm"
                    />
                    {editData.file && (
                      <p className="mt-1 text-xs text-gray-500">{editData.file.name} · {(editData.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    )}
                  </div>
                )}

                {/* Replace URL (link type only) */}
                {editData.mediaType === 'link' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                    <input
                      type="url"
                      value={editData.url}
                      onChange={e => setEditData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                    required
                  />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caption</label>
                  <textarea
                    value={editData.caption}
                    onChange={e => setEditData(prev => ({ ...prev, caption: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm resize-none"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={editData.order}
                    onChange={e => setEditData(prev => ({ ...prev, order: e.target.value }))}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editData.isActive}
                    onChange={e => setEditData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 text-neon-blue focus:ring-neon-blue rounded"
                    id="editActive"
                  />
                  <label htmlFor="editActive" className="text-gray-700 dark:text-gray-300 text-sm cursor-pointer">
                    Active (visible on website)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Saving…</>
                    : <><FiSave /> Save Changes</>
                  }
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-dark-border shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delete Result</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Are you sure you want to delete this result? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAlert(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteAlert)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageResults;
