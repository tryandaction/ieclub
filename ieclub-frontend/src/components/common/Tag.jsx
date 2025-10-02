import React from 'react';

export const Tag = ({ children, variant = 'blue', onRemove, interactive }) => {
  const variants = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <span className={`${variants[variant]} px-3 py-1.5 rounded-full text-sm inline-flex items-center gap-2 border ${interactive ? 'cursor-pointer hover:shadow-sm transition-all' : ''}`}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-white hover:bg-opacity-50 rounded-full p-0.5 transition-colors">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-0.5 bg-current rotate-45"></div>
              <div className="w-3 h-0.5 bg-current -rotate-45 absolute"></div>
            </div>
          </div>
        </button>
      )}
    </span>
  );
};
