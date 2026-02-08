import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  const fetchPurchasedCourses = async () => {
    try {
      const response = await api.get('/courses/user/purchased');
      setPurchasedCourses(response.data.purchasedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load your courses');
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

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-8">My Courses</h1>

          {purchasedCourses.length === 0 ? (
            <div className="text-center py-20">
              <FiBook className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No courses yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Start learning by purchasing your first course</p>
              <a
                href="/courses"
                className="inline-block px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-neon transition-all"
              >
                Browse Courses
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedCourses.map((purchase) => (
                <div
                  key={purchase._id}
                  className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden hover-lift shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={purchase.course.image}
                    alt={purchase.course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {purchase.course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {purchase.course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiDollarSign className="w-4 h-4" />
                        <span>₹{purchase.amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <a
                      href={`/courses/${purchase.course._id}`}
                      className="block w-full py-2 bg-gradient-primary text-white text-center font-semibold rounded-lg hover:shadow-neon transition-all"
                    >
                      Continue Learning
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyCourses;

