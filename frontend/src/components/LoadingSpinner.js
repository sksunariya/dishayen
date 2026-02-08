import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="spinner"></div>
        <p className="text-gray-400 mt-4 text-center">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

