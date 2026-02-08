import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import CourseCard from '../components/CourseCard';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    level: '',
    sort: '-createdAt'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update filters from URL params
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== filters.category) {
      setFilters(prev => ({ ...prev, category: categoryFromUrl }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      params.append('sort', filters.sort);

      const response = await api.get(`/courses?${params.toString()}`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Explore Courses</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Discover our extensive collection of courses and start learning today
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8 space-y-4 bg-white dark:bg-dark-elevated p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon && `${cat.icon} `}{cat.name}
                </option>
              ))}
            </select>

            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:border-neon-blue transition-colors text-gray-900 dark:text-white"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-averageRating">Highest Rated</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {loading ? 'Loading...' : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} found`}
          </p>
        </div>

        {/* Courses grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-96 rounded-xl"></div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <CourseCard key={course._id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-dark-elevated rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
            <FiFilter className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;

