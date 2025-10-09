import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, MessageCircle, Calendar, Users, TrendingUp, Settings, LogOut, Upload, Heart, Bookmark, Share2, Send, ChevronDown, Home, User, Plus, ArrowLeft } from 'lucide-react';

// 导入现有的页面组件
import { HomePage } from './pages/home/HomePage.jsx';
import { EventsPage } from './pages/events/EventsPage.jsx';
import { MatchPage } from './pages/match/MatchPage.jsx';
import { ProfilePage } from './pages/profile/ProfilePage.jsx';
import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage.jsx';
import { BookmarksPage } from './pages/bookmarks/BookmarksPage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';

export default function MobileOptimizedUI() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 移动端底部导航栏
  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {[
          { id: 'home', icon: Home, label: '首页' },
          { id: 'events', icon: Calendar, label: '活动' },
          { id: 'match', icon: Users, label: '匹配' },
          { id: 'ranking', icon: TrendingUp, label: '排行' },
          { id: 'profile', icon: User, label: '我的' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentPage(item.id);
              setShowMobileMenu(false);
            }}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <div className={`flex items-center justify-center ${
              currentPage === item.id
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}>
              <item.icon size={20} />
            </div>
            <span className={`text-xs mt-1 ${
              currentPage === item.id ? 'text-blue-600 font-medium' : 'text-gray-600'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // 移动端顶部导航栏
  const MobileTopNav = () => (
    <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-40 safe-area-top">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          IEclub
        </h1>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Search size={20} className="text-gray-700" />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full relative"
          >
            <Bell size={20} className="text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </div>
  );

  // 桌面端侧边栏
  const DesktopSidebar = () => (
    <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          IEclub
        </h1>
        <nav className="space-y-2">
          {[
            { id: 'home', icon: Home, label: '首页' },
            { id: 'events', icon: Calendar, label: '活动广场' },
            { id: 'match', icon: Users, label: '兴趣匹配' },
            { id: 'ranking', icon: TrendingUp, label: '排行榜' },
            { id: 'bookmarks', icon: Bookmark, label: '收藏' },
            { id: 'profile', icon: User, label: '个人主页' },
            { id: 'settings', icon: Settings, label: '设置' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <DesktopSidebar />

      {/* 移动端顶部导航 */}
      {isMobile && <MobileTopNav />}

      {/* 主内容区 */}
      <div className={`${isMobile ? 'pb-20 pt-4' : 'md:ml-64 p-8'} max-w-4xl mx-auto`}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'match' && <MatchPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'ranking' && <LeaderboardPage />}
        {currentPage === 'bookmarks' && <BookmarksPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'create' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mx-4">
            <h2 className="text-xl font-bold mb-4">发布内容</h2>
            <textarea
              className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="分享你的想法..."
            ></textarea>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium">
              发布
            </button>
          </div>
        )}
      </div>

      {/* 移动端底部导航 */}
      {isMobile && <MobileBottomNav />}

      {/* 移动端浮动发布按钮 */}
      {isMobile && (
        <button
          onClick={() => setCurrentPage('create')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* 桌面端浮动按钮 */}
      {!isMobile && (
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}