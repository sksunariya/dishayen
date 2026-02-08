import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiSearch, FiFilter, FiShield, FiShieldOff, FiEye, FiMail,
  FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import api, { getAvatarUrl } from '../../utils/api';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingUser, setBlockingUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10
      };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { reason: blockReason });
      toast.success('User blocked successfully');
      setShowBlockModal(false);
      setBlockingUser(null);
      setBlockReason('');
      fetchUsers();
    } catch (error) {
      console.error('Block user error:', error);
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/unblock`);
      toast.success('User unblocked successfully');
      fetchUsers();
    } catch (error) {
      console.error('Unblock user error:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
                <FiUsers className="text-neon-blue" />
                Manage Users
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View and manage all registered users
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="glass-effect p-6 rounded-xl mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12 w-full"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input-field pl-12 w-full"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-blue border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="glass-effect rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Courses
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={user.name}
                                src={getAvatarUrl(user)}
                                size="md"
                              />
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {user._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <FiMail className="text-gray-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isBlocked ? (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-semibold">
                                <FiShieldOff />
                                Blocked
                              </span>
                            ) : user.isVerified ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                                <FiCheckCircle />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                                <FiXCircle />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {user.purchasedCourses?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-neon-blue hover:text-neon-pink transition-colors"
                                title="View Details"
                              >
                                <FiEye className="w-5 h-5" />
                              </button>
                              {user.role !== 'admin' && (
                                user.isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user._id)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                    title="Unblock User"
                                  >
                                    <FiShield className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setBlockingUser(user);
                                      setShowBlockModal(true);
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                    title="Block User"
                                  >
                                    <FiShieldOff className="w-5 h-5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-200 dark:bg-dark-elevated text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-dark-surface transition-colors"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="text-gray-700 dark:text-gray-300 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-200 dark:bg-dark-elevated text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-dark-surface transition-colors"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                User Details
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={selectedUser.name}
                    src={getAvatarUrl(selectedUser)}
                    size="xl"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                    <p className="text-gray-900 dark:text-white font-medium capitalize">
                      {selectedUser.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedUser.isVerified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Courses</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedUser.purchasedCourses?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Joined Date</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selectedUser.phone}
                      </p>
                    </div>
                  )}
                </div>

                {selectedUser.bio && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Bio</p>
                    <p className="text-gray-700 dark:text-gray-300">{selectedUser.bio}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="btn-primary w-full mt-6"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showBlockModal && blockingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowBlockModal(false);
              setBlockingUser(null);
              setBlockReason('');
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-effect rounded-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <FiShieldOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Block User?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to block <strong>{blockingUser.name}</strong>?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-semibold mb-1">Blocked users will:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Be unable to log in</li>
                      <li>Be unable to register with this email</li>
                      <li>See a message to contact support</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for blocking (optional):
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="E.g., Violation of terms of service..."
                  rows="3"
                  className="input-field w-full resize-y"
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {blockReason.length}/500 characters
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockingUser(null);
                    setBlockReason('');
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBlockUser(blockingUser._id)}
                  className="btn-primary bg-red-600 hover:bg-red-700 flex-1 flex items-center justify-center gap-2"
                >
                  <FiShieldOff className="w-4 h-4" />
                  Block User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsers;
