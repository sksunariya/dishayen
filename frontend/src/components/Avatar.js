import React, { useState } from 'react';

const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
    '2xl': 'w-32 h-32 text-5xl',
  };

  // Colors for default avatars
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-cyan-500 to-cyan-600',
  ];

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get consistent color based on name
  const getColorFromName = (name) => {
    if (!name) return colors[0];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-neon-blue ${className}`}
        onError={handleImageError}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${bgColor} text-white font-bold border-2 border-neon-blue ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;

