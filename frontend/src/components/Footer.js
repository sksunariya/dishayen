import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import api from '../utils/api';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchRandomCategories();
  }, []);

  const fetchRandomCategories = async () => {
    try {
      const response = await api.get('/categories');
      const allCategories = response.data.categories || [];
      
      // Shuffle and take first 5 categories
      const shuffled = [...allCategories].sort(() => 0.5 - Math.random());
      setCategories(shuffled.slice(0, 5));
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fail silently - footer should still display even if categories fail to load
    }
  };

  return (
    <footer className="bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold gradient-text">Dishayen Coaching</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Empowering learners worldwide with quality education and expert coaching.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors">
                <FiFacebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                 className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category._id}>
                    <Link 
                      to={`/courses?category=${category._id}`} 
                      className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm flex items-center gap-1"
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-gray-600 dark:text-gray-400 text-sm">
                  Loading categories...
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-600 dark:text-gray-400 text-sm">
                <FiMapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>123 Education Street, Tech City, TC 12345</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 text-sm">
                <FiMail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@eduplatform.com" className="hover:text-neon-blue dark:hover:text-neon-blue transition-colors">
                  info@eduplatform.com
                </a>
              </li>
              <li className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 text-sm">
                <FiPhone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-neon-blue dark:hover:text-neon-blue transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              &copy; {currentYear} Dishayen Coaching Center. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-neon-blue transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

