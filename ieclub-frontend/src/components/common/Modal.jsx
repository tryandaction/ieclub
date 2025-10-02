import React from 'react';
// 关闭按钮的 X 图标由 Modal 组件自己负责导入
// import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'default' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`bg-white rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp`}>
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-gray-600 rotate-45"></div>
                <div className="w-5 h-0.5 bg-gray-600 -rotate-45 absolute"></div>
              </div>
            </div>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};