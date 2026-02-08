import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check localStorage or user preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    // Remove both classes first
    document.documentElement.classList.remove('light', 'dark');
    document.body.classList.remove('light', 'dark');
    
    // Add the new theme class
    document.documentElement.classList.add(newTheme);
    document.body.classList.add(newTheme);
    
    // Update background color
    if (newTheme === 'light') {
      document.body.style.backgroundColor = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#0a0a0a';
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

