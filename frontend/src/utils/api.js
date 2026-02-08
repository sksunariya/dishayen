import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// Helper to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${SERVER_URL}${imagePath}`;
};

// Helper to get avatar URL - now uses Cloudinary
export const getAvatarUrl = (user) => {
  if (!user) {
    return null;
  }
  
  // Avatar field now contains the full Cloudinary URL
  if (user.avatar) {
    // If it's already a full URL (Cloudinary), return as is
    if (user.avatar.startsWith('http')) {
      return user.avatar;
    }
    // Otherwise, it's a legacy path
    return getImageUrl(user.avatar);
  }
  
  return null;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 180000, // 3 minutes timeout (increased for large image uploads to Cloudinary)
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      // Check if it's a CORS error
      if (error.message === 'Network Error') {
        console.error('⚠️ CORS or Network issue detected. Check if backend is running on http://localhost:5000');
      }
      // Don't redirect on network errors, just reject
      return Promise.reject(error);
    }

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;
      
      // If token expired, try to refresh
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        originalRequest._retry = true;

        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          isRefreshing = false;
          processQueue(new Error('No refresh token'), null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          // Try to refresh the token
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update the authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          processQueue(null, token);
          
          console.log('✅ Token refreshed successfully');
          
          isRefreshing = false;
          
          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          console.warn('🔒 Token refresh failed - logging out');
          
          // Refresh failed, clear tokens and redirect
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/verify')) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      }

      // For other 401 errors, redirect to login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/verify')) {
      localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

