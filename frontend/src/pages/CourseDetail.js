import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiClock, FiUsers, FiPlay, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h2>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-gradient-primary text-white rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-gradient-primary text-white text-sm font-semibold rounded-full">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white dark:bg-dark-elevated text-gray-900 dark:text-white text-sm rounded-full border border-gray-200 dark:border-dark-border">
                  {course.level}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                {course.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <FiStar className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-gray-900 dark:text-white font-semibold">{course.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400">({course.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FiUsers className="w-5 h-5" />
                  <span>{course.enrolledStudents} students</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FiClock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400">
                <span className="text-gray-900 dark:text-white font-semibold">Instructor:</span> {course.instructor}
              </p>
            </motion.div>
          </div>

          {/* Purchase card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border sticky top-24 shadow-lg"
            >
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-6"
              />

              <div className="mb-6">
                <span className="text-4xl font-bold text-neon-blue">₹{course.price.toLocaleString()}</span>
              </div>

              {course.isPurchased ? (
                <button
                  onClick={() => navigate('/my-courses')}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg mb-3"
                >
                  Already Purchased - View in My Courses
                </button>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* Course content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Course</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
            </div>

            {/* What you'll learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {course.whatYouWillLearn.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <FiCheckCircle className="w-5 h-5 text-neon-blue flex-shrink-0 mt-1" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample videos */}
            {course.sampleVideos && course.sampleVideos.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sample Videos</h2>
                <div className="space-y-4">
                  {course.sampleVideos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-surface rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface/70 transition-colors border border-gray-200 dark:border-transparent">
                      <div className="flex items-center space-x-3">
                        <FiPlay className="w-5 h-5 text-neon-blue" />
                        <span className="text-gray-900 dark:text-white">{video.title}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{video.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border mb-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h3>
                <ul className="space-y-2">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                      <span className="text-neon-blue mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CourseDetail;
