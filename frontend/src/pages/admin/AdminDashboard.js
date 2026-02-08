import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiBook, FiDollarSign, FiStar, FiMessageSquare, FiTrendingUp, FiImage, FiMail, FiSettings, FiVideo, FiFolder, FiFileText, FiUserCheck } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      icon: FiUsers,
      label: 'Total Users',
      value: stats?.stats.totalUsers || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: FiBook,
      label: 'Total Courses',
      value: stats?.stats.totalCourses || 0,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: FiDollarSign,
      label: 'Total Revenue',
      value: `₹${stats?.stats.totalRevenue?.toLocaleString() || 0}`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: FiMessageSquare,
      label: 'Pending Testimonials',
      value: stats?.stats.pendingTestimonials || 0,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-8">Admin Dashboard</h1>

          {/* Stats grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.label}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              to="/admin/courses"
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
            >
              <FiBook className="w-8 h-8 text-neon-blue mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage Courses</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Create, edit, and delete courses</p>
            </Link>

            <Link
              to="/admin/testimonials"
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
            >
              <FiMessageSquare className="w-8 h-8 text-neon-purple mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage Testimonials</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Approve or reject testimonials</p>
            </Link>

            <Link
              to="/admin/users"
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
            >
              <FiUsers className="w-8 h-8 text-neon-cyan mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage Users</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage user accounts</p>
            </Link>

            <Link
              to="/admin/carousel"
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
            >
              <FiImage className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage Carousel</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Add and manage carousel images</p>
            </Link>

            <Link
              to="/admin/queries"
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
            >
              <FiMail className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Query Management</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View and respond to contact queries</p>
            </Link>

          <Link
            to="/admin/settings"
            className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
          >
            <FiSettings className="w-8 h-8 text-indigo-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Site Settings</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage demo video and site configuration</p>
          </Link>

          <Link
            to="/admin/video-testimonials"
            className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
          >
            <FiVideo className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Video Testimonials</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage video testimonials from students</p>
          </Link>

          <Link
            to="/admin/categories"
            className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
          >
            <FiFolder className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage Categories</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Organize courses into categories</p>
          </Link>

          <Link
            to="/admin/news"
            className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
          >
            <FiFileText className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manage News</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Add and manage news items</p>
          </Link>

          <Link
            to="/admin/visitor-inquiries"
            className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border hover:border-neon-blue shadow-lg hover:shadow-xl transition-all"
          >
            <FiUserCheck className="w-8 h-8 text-teal-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Visitor Inquiries</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View and manage first-time visitor forms</p>
          </Link>
        </div>

          {/* Recent enrollments */}
          {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
            <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Enrollments</h2>
              <div className="space-y-4">
                {stats.recentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-transparent"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {enrollment.user?.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold">{enrollment.user?.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{enrollment.course?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-blue font-bold">₹{enrollment.amount.toLocaleString()}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;

