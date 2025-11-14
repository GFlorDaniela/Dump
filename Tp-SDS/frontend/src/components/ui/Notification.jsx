import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const Notification = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[notification.type] || 'bg-gray-500';

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[notification.type] || '💡';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`${bgColor} text-white rounded-2xl shadow-2xl p-4 transform transition-all duration-300 animate-in slide-in-from-right`}>
        <div className="flex items-start space-x-3">
          <div className="text-xl flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            onClick={hideNotification}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors duration-200"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;