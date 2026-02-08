import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiUsers, FiClock } from 'react-icons/fi';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { motion } from 'framer-motion';
import 'react-lazy-load-image-component/src/effects/blur.css';

const CourseCard = ({ course, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white dark:bg-dark-elevated rounded-xl overflow-hidden border border-light-border dark:border-dark-border hover-lift hover:shadow-neon"
    >
      <Link to={`/courses/${course._id}`}>
        <div className="relative overflow-hidden h-48">
          <LazyLoadImage
            src={course.image}
            alt={course.title}
            effect="blur"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-gradient-primary text-white text-xs font-semibold rounded-full">
              {course.level}
            </span>
          </div>
          {course.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 bg-gradient-secondary text-white text-xs font-semibold rounded-full">
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neon-blue font-semibold">
              {typeof course.category === 'object' ? course.category.name : course.category}
            </span>
            <div className="flex items-center space-x-1">
              <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold">{course.averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({course.totalReviews})</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-neon-blue transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {course.shortDescription}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiUsers className="w-4 h-4" />
              <span>{course.enrolledStudents} enrolled</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-neon-blue">₹{course.price.toLocaleString()}</span>
            </div>
            <span className="px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg group-hover:shadow-neon transition-all">
              View Course
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CourseCard;

