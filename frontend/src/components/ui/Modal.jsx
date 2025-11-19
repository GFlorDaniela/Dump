import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;