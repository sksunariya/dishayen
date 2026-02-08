import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare, FiCheck, FiX, FiArchive, FiStar,
  FiFilter, FiClock, FiSearch, FiCalendar, FiRefreshCw, FiRotateCcw
} from 'react-icons/fi';
import api, { getAvatarUrl } from '../../utils/api';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';

const ManageTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [allTestimonials, setAllTestimonials] = useState([]); // For accurate counts
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingTestimonial, setArchivingTestimonial] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, [statusFilter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // Fetch filtered testimonials for display
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/admin/testimonials', { params });
      setTestimonials(response.data.testimonials);
      
      // Fetch all testimonials for accurate counts (only if we haven't loaded all)
      if (statusFilter !== 'all') {
        const allResponse = await api.get('/admin/testimonials');
        setAllTestimonials(allResponse.data.testimonials);
      } else {
        // If showing all, use the same data for counts
        setAllTestimonials(response.data.testimonials);
      }
    } catch (error) {
      console.error('Fetch testimonials error:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/testimonials/${id}/approve`);
      toast.success('Testimonial approved');
      fetchTestimonials();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve testimonial');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/testimonials/${id}/reject`);
      toast.success('Testimonial rejected');
      fetchTestimonials();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject testimonial');
    }
  };

  const handleArchive = async (id) => {
    try {
      await api.put(`/admin/testimonials/${id}/archive`);
      toast.success('Testimonial archived');
      setShowArchiveModal(false);
      setArchivingTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive testimonial');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/admin/testimonials/${id}/restore`);
      toast.success('Testimonial restored to pending');
      fetchTestimonials();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore testimonial');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600',
      approved: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600',
      rejected: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600',
      archived: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600'
    };
    return styles[status] || styles.pending;
  };

  // Apply all filters
  const filteredTestimonials = testimonials.filter(testimonial => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = testimonial.user.name.toLowerCase().includes(searchLower);
      const emailMatch = testimonial.user.email.toLowerCase().includes(searchLower);
      const contentMatch = testimonial.content?.toLowerCase().includes(searchLower) || 
                           testimonial.message?.toLowerCase().includes(searchLower);
      if (!nameMatch && !emailMatch && !contentMatch) return false;
    }

    // Rating filter
    if (ratingFilter !== 'all' && testimonial.rating !== parseInt(ratingFilter)) {
      return false;
    }

    // Date range filter
    if (dateRange.start) {
      const testimonialDate = new Date(testimonial.createdAt);
      const startDate = new Date(dateRange.start);
      if (testimonialDate < startDate) return false;
    }
    if (dateRange.end) {
      const testimonialDate = new Date(testimonial.createdAt);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      if (testimonialDate > endDate) return false;
    }

    return true;
  });

  // Calculate counts from all testimonials (not filtered by status)
  const pendingCount = allTestimonials.filter(t => t.status === 'pending').length;
  const approvedCount = allTestimonials.filter(t => t.status === 'approved').length;
  const rejectedCount = allTestimonials.filter(t => t.status === 'rejected').length;
  const archivedCount = allTestimonials.filter(t => t.status === 'archived').length;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-3 mb-2">
              <FiMessageSquare className="text-neon-blue" />
              Manage Testimonials
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review, approve, and manage student testimonials
            </p>
          </div>

          {/* Stats Dashboard */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {pendingCount}
                  </p>
                </div>
                <div className="p-4 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                  <FiClock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {approvedCount}
                  </p>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-500/20 rounded-lg">
                  <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {rejectedCount}
                  </p>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-lg">
                  <FiX className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect p-6 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Archived</p>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {archivedCount}
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-500/20 rounded-lg">
                  <FiArchive className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Creative Filters Section */}
          <div className="glass-effect rounded-2xl overflow-hidden mb-6">
            {/* Filter Header */}
            <div className="bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 dark:from-neon-blue/20 dark:to-neon-purple/20 px-6 py-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                    <FiFilter className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Filter & Search
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {filteredTestimonials.length} of {testimonials.length} testimonials
                    </p>
                  </div>
                </div>
                {(searchTerm || ratingFilter !== 'all' || dateRange.start || dateRange.end || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRatingFilter('all');
                      setDateRange({ start: '', end: '' });
                      setStatusFilter('all');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-elevated rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    <FiRefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-6">
              {/* Quick Status Filters - Pill Style */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Quick Status Filter
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'all', label: 'All', icon: FiMessageSquare, color: 'gray' },
                    { value: 'pending', label: 'Pending', icon: FiClock, color: 'yellow', count: pendingCount },
                    { value: 'approved', label: 'Approved', icon: FiCheck, color: 'green', count: approvedCount },
                    { value: 'rejected', label: 'Rejected', icon: FiX, color: 'red', count: rejectedCount },
                    { value: 'archived', label: 'Archived', icon: FiArchive, color: 'gray', count: archivedCount }
                  ].map((status) => {
                    const Icon = status.icon;
                    const isActive = statusFilter === status.value;
                    const colorClasses = {
                      gray: isActive 
                        ? 'bg-gray-600 text-white border-gray-600' 
                        : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500/30',
                      yellow: isActive 
                        ? 'bg-yellow-600 text-white border-yellow-600' 
                        : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-500/30',
                      green: isActive 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-200 dark:hover:bg-green-500/30',
                      red: isActive 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-500/30'
                    };

                    return (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 font-medium transition-all transform hover:scale-105 ${
                          colorClasses[status.color]
                        } ${isActive ? 'shadow-lg' : 'shadow-sm'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{status.label}</span>
                        {status.count !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-white dark:bg-dark-surface'
                          }`}>
                            {status.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Filters Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Search Box */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Search Testimonials
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors z-10" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-12 pr-4 w-full text-base py-3 focus:ring-2 focus:ring-neon-blue/50 transition-all"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-dark-elevated rounded-full transition-colors"
                        >
                          <FiX className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Filter with Stars */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Rating
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-3 h-3 ${
                            ratingFilter !== 'all' && i < parseInt(ratingFilter)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="input-field pl-24 w-full appearance-none cursor-pointer"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars Only</option>
                      <option value="4">4 Stars Only</option>
                      <option value="3">3 Stars Only</option>
                      <option value="2">2 Stars Only</option>
                      <option value="1">1 Star Only</option>
                    </select>
                  </div>
                </div>

                {/* Date Range - Modern Calendar Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Start Date
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple pointer-events-none" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="input-field pl-12 w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    End Date
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-purple pointer-events-none" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="input-field pl-12 w-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters Chips */}
              {(searchTerm || ratingFilter !== 'all' || dateRange.start || dateRange.end) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Active Filters:
                    </span>
                    
                    {searchTerm && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                        <FiSearch className="w-3 h-3" />
                        "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {ratingFilter !== 'all' && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                        <FiStar className="w-3 h-3" />
                        {ratingFilter} Stars
                        <button
                          onClick={() => setRatingFilter('all')}
                          className="hover:bg-yellow-200 dark:hover:bg-yellow-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {dateRange.start && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        <FiCalendar className="w-3 h-3" />
                        From: {new Date(dateRange.start).toLocaleDateString()}
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, start: '' }))}
                          className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {dateRange.end && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                        <FiCalendar className="w-3 h-3" />
                        To: {new Date(dateRange.end).toLocaleDateString()}
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, end: '' }))}
                          className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Testimonials List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-blue border-t-transparent"></div>
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="glass-effect p-12 rounded-2xl text-center">
              <FiMessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No testimonials found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || ratingFilter !== 'all' || dateRange.start || dateRange.end
                  ? 'Try adjusting your filters'
                  : statusFilter === 'all'
                  ? 'No testimonials have been submitted yet'
                  : `No ${statusFilter} testimonials`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect p-6 rounded-xl hover:shadow-neon transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={testimonial.user.name}
                      src={getAvatarUrl(testimonial.user)}
                      size="lg"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {testimonial.user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {testimonial.user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${getStatusBadge(testimonial.status)}`}>
                            {testimonial.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {testimonial.rating}/5
                        </span>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {testimonial.content || testimonial.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>

                        <div className="flex items-center gap-2">
                          {testimonial.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(testimonial._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                title="Approve"
                              >
                                <FiCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(testimonial._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FiX className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {testimonial.status === 'rejected' && (
                            <button
                              onClick={() => handleApprove(testimonial._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              title="Re-approve"
                            >
                              <FiRotateCcw className="w-4 h-4" />
                              Re-approve
                            </button>
                          )}

                          {testimonial.status === 'archived' && (
                            <button
                              onClick={() => handleRestore(testimonial._id)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              title="Restore"
                            >
                              <FiRotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                          )}

                          {testimonial.status !== 'archived' && (
                            <button
                              onClick={() => {
                                setArchivingTestimonial(testimonial);
                                setShowArchiveModal(true);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500/20 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <FiArchive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {showArchiveModal && archivingTestimonial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowArchiveModal(false);
              setArchivingTestimonial(null);
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Archive Testimonial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to archive the testimonial from <strong>{archivingTestimonial.user.name}</strong>? 
                Archived testimonials will be hidden from the main list but can be restored later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setArchivingTestimonial(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleArchive(archivingTestimonial._id)}
                  className="btn-primary bg-gray-600 hover:bg-gray-700 flex-1 flex items-center justify-center gap-2"
                >
                  <FiArchive className="w-5 h-5" />
                  Archive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageTestimonials;
