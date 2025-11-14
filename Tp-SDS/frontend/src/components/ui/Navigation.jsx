import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ items, className = '' }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={className}>
      <div className="flex space-x-1">
        {items.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              isActive(item.href)
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;