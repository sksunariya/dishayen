import React from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';

const CourseCard = ({ course, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white dark:bg-dark-elevated rounded-xl overflow-hidden border border-light-border dark:border-dark-border hover-lift hover:shadow-neon"
    >
      <a href={course.url} target="_blank" rel="noopener noreferrer">
        <div className="relative bg-gray-100 dark:bg-gray-800">
          <img
            src={course.image || 'https://via.placeholder.com/800x600?text=Course+Thumbnail'}
            alt={course.title}
            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
          />
          {course.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 bg-gradient-secondary text-white text-xs font-semibold rounded-full">
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {course.category && (
            <div className="mb-2">
              <span className="text-xs text-neon-blue font-semibold">
                {typeof course.category === 'object' ? course.category.name : course.category}
              </span>
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 group-hover:text-neon-blue transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg group-hover:shadow-neon transition-all flex items-center gap-2">
              Buy Now <FiExternalLink className="w-4 h-4" />
            </span>
          </div>
        </div>
      </a>
    </motion.div>
  );
};

export default CourseCard;
