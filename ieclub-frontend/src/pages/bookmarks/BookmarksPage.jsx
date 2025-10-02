import React from 'react';
import { Bookmark } from 'lucide-react';

export const BookmarksPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">我的收藏</h2>
        <p className="text-gray-600">你收藏的帖子和活动</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">全部</button>
          <button className="px-4 py-2 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">帖子</button>
          <button className="px-4 py-2 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">活动</button>
        </div>
      </div>
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
        <Bookmark size={64} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg mb-2">还没有收藏内容</p>
        <p className="text-gray-500 text-sm">在浏览时点击收藏按钮保存你喜欢的内容</p>
      </div>
    </div>
  );
};