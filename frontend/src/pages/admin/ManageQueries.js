import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, FiSearch, FiFilter, FiX, FiClock, 
  FiMessageSquare, FiCheckCircle, FiAlertCircle,
  FiSend, FiChevronDown, FiChevronUp, FiUser, FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const ManageQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [expandedQueryId, setExpandedQueryId] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQueries();
  }, []);

  useEffect(() => {
    if (hasFetched.current) {
      const delayDebounceFn = setTimeout(() => {
        fetchQueries();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [statusFilter, priorityFilter, searchTerm, sortBy]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);

      const response = await api.get(`/admin/queries?${params.toString()}`);
      setQueries(response.data.queries);
      setStatusCounts(response.data.statusCounts);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (queryId, newStatus) => {
    try {
      await api.patch(`/admin/queries/${queryId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchQueries();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUpdateQuery = async (queryId, updates) => {
    try {
      await api.patch(`/admin/queries/${queryId}`, updates);
      toast.success('Query updated successfully');
      fetchQueries();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating query:', error);
      toast.error(error.response?.data?.message || 'Failed to update query');
    }
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    try {
      await api.post(`/admin/queries/${selectedQuery._id}/respond`, { responseMessage });
      toast.success('Response sent successfully');
      setResponseMessage('');
      setShowResponseModal(false);
      fetchQueries();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error(error.response?.data?.message || 'Failed to send response');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      Urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300',
      'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300',
      Resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300',
      Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300'
    };
    return colors[status] || colors.Open;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FiMail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Query Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and respond to contact form submissions
                </p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { status: 'Open', icon: FiAlertCircle, color: 'blue' },
              { status: 'In Progress', icon: FiClock, color: 'purple' },
              { status: 'Resolved', icon: FiCheckCircle, color: 'green' }
            ].map((item) => (
              <motion.div
                key={item.status}
                whileHover={{ scale: 1.02 }}
                onClick={() => setStatusFilter(statusFilter === item.status ? '' : item.status)}
                className={`glass-effect p-6 rounded-xl cursor-pointer transition-all ${
                  statusFilter === item.status 
                    ? `border-2 border-${item.color}-500 shadow-lg` 
                    : 'border border-gray-200 dark:border-dark-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.status}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {statusCounts[item.status] || 0}
                    </p>
                  </div>
                  <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect p-6 rounded-2xl border border-gray-200 dark:border-dark-border mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="w-5 h-5 text-neon-blue" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters & Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-12"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-priority">Priority: High to Low</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Active Filters */}
          {(statusFilter || priorityFilter || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Filters:</span>
              {statusFilter && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  Status: {statusFilter}
                  <FiX className="cursor-pointer" onClick={() => setStatusFilter('')} />
                </span>
              )}
              {priorityFilter && (
                <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  Priority: {priorityFilter}
                  <FiX className="cursor-pointer" onClick={() => setPriorityFilter('')} />
                </span>
              )}
              {searchTerm && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <FiX className="cursor-pointer" onClick={() => setSearchTerm('')} />
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Queries List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-blue border-t-transparent"></div>
          </div>
        ) : queries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect p-12 rounded-2xl text-center"
          >
            <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Queries Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter || priorityFilter || searchTerm
                ? 'Try adjusting your filters'
                : 'No contact queries yet'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {queries.map((query, index) => (
              <motion.div
                key={query._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-effect rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden"
              >
                {/* Query Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {query.firstName} {query.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(query.status)}`}>
                          {query.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(query.priority)}`}>
                          {query.priority}
                        </span>
                        {query.isRegisteredUser ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                            <FiUserCheck className="w-3 h-3" />
                            Registered User
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiMail className="w-4 h-4" />
                          {query.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          {formatDate(query.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedQueryId(expandedQueryId === query._id ? null : query._id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg transition-colors"
                    >
                      {expandedQueryId === query._id ? (
                        <FiChevronUp className="w-5 h-5" />
                      ) : (
                        <FiChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Message Preview */}
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                    {query.message}
                  </p>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {query.status === 'Open' && (
                      <button
                        onClick={() => handleStatusChange(query._id, 'In Progress')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-2"
                      >
                        <FiClock className="w-4 h-4" />
                        Mark In Progress
                      </button>
                    )}
                    {(query.status === 'Open' || query.status === 'In Progress') && (
                      <button
                        onClick={() => {
                          setSelectedQuery(query);
                          setResponseMessage('');
                          setShowResponseModal(true);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
                      >
                        <FiSend className="w-4 h-4" />
                        Send Response
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedQueryId === query._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-6 bg-gray-50 dark:bg-dark-elevated space-y-4">
                        {/* Registered User Info */}
                        {query.isRegisteredUser && query.user && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                              <FiUserCheck className="w-4 h-4" />
                              Registered User Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
                                <p className="text-gray-900 dark:text-white font-medium">{query.user.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                <p className="text-gray-900 dark:text-white font-medium">{query.user.email}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Full Message */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Full Message:
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-dark-bg p-4 rounded-lg">
                            {query.message}
                          </p>
                        </div>

                        {/* Admin Notes */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Admin Notes:
                          </h4>
                          <textarea
                            value={query.adminNotes}
                            onChange={(e) => {
                              const updatedQueries = queries.map(q =>
                                q._id === query._id ? { ...q, adminNotes: e.target.value } : q
                              );
                              setQueries(updatedQueries);
                            }}
                            onBlur={() => handleUpdateQuery(query._id, { adminNotes: query.adminNotes })}
                            placeholder="Add internal notes..."
                            rows="3"
                            className="input-field w-full"
                          />
                        </div>

                        {/* Response Message */}
                        {query.responseMessage && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Response Sent:
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                              {query.responseMessage}
                            </p>
                          </div>
                        )}

                        {/* Priority Selector */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Priority:
                          </h4>
                          <select
                            value={query.priority}
                            onChange={(e) => handleUpdateQuery(query._id, { priority: e.target.value })}
                            className="input-field"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>

                        {/* Metadata */}
                        {(query.resolvedAt || query.resolvedBy) && (
                          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {query.resolvedAt && (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Resolved At:</span>
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {formatDate(query.resolvedAt)}
                                  </p>
                                </div>
                              )}
                              {query.resolvedBy && (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Resolved By:</span>
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {query.resolvedBy.name || query.resolvedBy.email}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        <AnimatePresence>
          {showResponseModal && selectedQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowResponseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Send Response
                  </h2>
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-elevated rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Original Message */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Original Message from {selectedQuery.firstName}:
                  </h3>
                  <div className="bg-gray-100 dark:bg-dark-elevated p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedQuery.message}
                    </p>
                  </div>
                </div>

                {/* Response Textarea */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Response: *
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response here..."
                    rows="8"
                    className="input-field w-full resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseMessage.trim()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <FiSend className="w-5 h-5" />
                    Send Response & Mark Resolved
                  </button>
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManageQueries;

