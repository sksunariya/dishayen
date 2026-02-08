import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Only clear token if it's an auth error (401), not network error
        if (error.response?.status === 401) {
        localStorage.removeItem('token');
          setUser(null);
        }
        // For network errors, keep trying silently
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      // Don't show toast here - let the component handle the error display
      // This prevents duplicate error messages
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      toast.success('Registration successful! Please check your email to verify your account.');
      return response.data;
    } catch (error) {
      // Don't show toast here - let the component handle the error display
      // This prevents duplicate error messages
      throw error;
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVerified: user?.isVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

