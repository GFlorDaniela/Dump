import React from 'react';

const LoadingSpinner = ({ message = "Cargando...", size = "large" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;