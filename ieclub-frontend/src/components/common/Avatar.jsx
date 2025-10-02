import React from 'react';

export const Avatar = ({ src, alt, size = 'md', status }) => {
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-32 h-32 text-6xl'
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white shadow-md`}>
        {src || alt}
      </div>
      {status && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      )}
    </div>
  );
};
