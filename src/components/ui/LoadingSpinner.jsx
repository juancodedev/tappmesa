import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-b-2'
  };

  const colorClasses = {
    primary: 'border-primary',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary} border-t-transparent`}></div>
    </div>
  );
};

export default LoadingSpinner;
