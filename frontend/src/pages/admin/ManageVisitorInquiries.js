import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEdit2, FiTrash2, FiFilter, FiRefreshCw, FiUser, FiPhone, FiBook, FiTarget, FiCheckCircle, FiXCircle, FiClock, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ManageVisitorInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    notes: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [selectedStatus, page]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      };
      const response = await api.get('/visitor-inquiries', { params });
      setInquiries(response.data.inquiries);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load visitor inquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/visitor-inquiries/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      await api.put(`/visitor-inquiries/${inquiryId}`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchInquiries();
      fetchStats();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (inquiry) => {
    setSelectedInquiry(inquiry);
    setEditData({
      status: inquiry.status,
      notes: inquiry.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInquiry) return;

    try {
      await api.put(`/visitor-inquiries/${selectedInquiry._id}`, editData);
      toast.success('Inquiry updated successfully');
      fetchInquiries();
      fetchStats();
      setShowEditModal(false);
      setSelectedInquiry(null);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) {
      return;
    }

    try {
      await api.delete(`/visitor-inquiries/${id}`);
      toast.success('Inquiry deleted successfully');
      fetchInquiries();
      fetchStats();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      toast.error('Failed to delete inquiry');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      unattended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      acknowledged: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status] || colors.unattended;
  };

  const getStatusIcon = (status) => {
    const icons = {
      unattended: FiClock,
      acknowledged: FiMessageSquare,
      contacted: FiPhone,
      completed: FiCheckCircle,
      rejected: FiXCircle
    };
    return icons[status] || FiClock;
  };

  if (loading && inquiries.length === 0) {
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
            <h1 className="text-4xl font-bold gradient-text">Manage Visitor Inquiries</h1>
            <button
              onClick={() => { fetchInquiries(); fetchStats(); }}
              className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-purple transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unattended}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unattended</div>
              </div>
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.acknowledged}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Acknowledged</div>
              </div>
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.contacted}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Contacted</div>
              </div>
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg mb-6">
            <div className="flex items-center gap-4">
              <FiFilter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="unattended">Unattended</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="contacted">Contacted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Inquiries List */}
          {inquiries.length === 0 ? (
            <div className="bg-white dark:bg-dark-elevated p-12 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg text-center">
              <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No visitor inquiries found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => {
                const StatusIcon = getStatusIcon(inquiry.status);
                return (
                  <motion.div
                    key={inquiry._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(inquiry.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(inquiry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-start gap-2">
                            <FiUser className="w-5 h-5 text-neon-blue mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Name</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{inquiry.name}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FiPhone className="w-5 h-5 text-neon-blue mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Mobile</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{inquiry.mobileNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FiBook className="w-5 h-5 text-neon-blue mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Class</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{inquiry.className}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <FiTarget className="w-5 h-5 text-neon-blue mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Exam</div>
                              <div className="font-semibold text-gray-900 dark:text-white">{inquiry.examPreparingFor}</div>
                            </div>
                          </div>
                        </div>

                        {inquiry.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{inquiry.notes}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(inquiry)}
                          className="p-2 text-neon-blue hover:bg-blue-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inquiry._id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-dark-border rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-dark-elevated rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Inquiry</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
                  >
                    <option value="unattended">Unattended</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={4}
                    maxLength={1000}
                    placeholder="Add notes about this inquiry..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editData.notes.length}/1000 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInquiry(null);
                  }}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageVisitorInquiries;

