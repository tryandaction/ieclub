import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, MessageCircle, Calendar, Users, TrendingUp, Settings, LogOut, Upload, Heart, Bookmark, Share2, Send, ChevronDown, Home, User, Plus, ArrowLeft } from 'lucide-react';

export default function IEclubMobileOptimized() {
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
      <div className="flex justify-around items-center h-16">
        {[
          { id: 'home', icon: Home, label: '首页' },
          { id: 'events', icon: Calendar, label: '活动' },
          { id: 'create', icon: Plus, label: '发布', highlight: true },
          { id: 'match', icon: Users, label: '匹配' },
          { id: 'profile', icon: User, label: '我的' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentPage(item.id);
              setShowMobileMenu(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              item.highlight 
                ? 'relative -top-4' 
                : ''
            }`}
          >
            <div className={`flex items-center justify-center ${
              item.highlight
                ? 'w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : currentPage === item.id
                  ? 'text-blue-600'
                  : 'text-gray-600'
            }`}>
              <item.icon size={item.highlight ? 24 : 20} />
            </div>
            {!item.highlight && (
              <span className={`text-xs mt-1 ${
                currentPage === item.id ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            )}
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

  // 首页内容（优化移动端布局）
  const HomePage = () => (
    <div className="space-y-4">
      {/* 移动端顶部快捷入口 */}
      {isMobile && (
        <div className="grid grid-cols-4 gap-3 px-4">
          {[
            { icon: MessageCircle, label: '论坛', color: 'from-blue-500 to-blue-600' },
            { icon: Calendar, label: '活动', color: 'from-purple-500 to-purple-600' },
            { icon: Users, label: '匹配', color: 'from-pink-500 to-pink-600' },
            { icon: Upload, label: 'OCR', color: 'from-orange-500 to-orange-600' }
          ].map((item, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <item.icon size={20} className="text-white" />
              </div>
              <span className="text-xs text-gray-700 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 帖子列表 */}
      {[1, 2, 3].map(i => (
        <div key={i} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all ${
          isMobile ? 'mx-4' : ''
        }`}>
          <div className="p-4">
            {/* 用户信息 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600"></div>
                <div>
                  <h3 className="font-semibold text-sm">张三</h3>
                  <p className="text-xs text-gray-500">计算机系 · 2小时前</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <ChevronDown size={20} />
              </button>
            </div>

            {/* 内容 */}
            <h2 className="text-base font-bold mb-2">
              {i === 1 && '如何高效学习React？分享我的经验'}
              {i === 2 && '南科大创新创业大赛即将开始！'}
              {i === 3 && '寻找志同道合的AI研究伙伴'}
            </h2>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              这是帖子的内容摘要，在移动端会自动截断过长的文本，保持界面整洁美观...
            </p>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">React</span>
              <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs">前端</span>
            </div>

            {/* 互动栏 */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                <Heart size={18} />
                <span className="text-sm">128</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                <MessageCircle size={18} />
                <span className="text-sm">32</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 transition-colors">
                <Bookmark size={18} />
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // 活动页面（移动端优化）
  const EventsPage = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
          isMobile ? 'mx-4' : ''
        }`}>
          {/* 活动封面 */}
          <div className="h-40 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"></div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold flex-1">
                {i === 1 && 'AI创新沙龙'}
                {i === 2 && '创业项目路演'}
                {i === 3 && '跨学科交流会'}
              </h3>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium whitespace-nowrap ml-2">
                报名中
              </span>
            </div>

            <div className="space-y-2 mb-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>2025年10月15日 14:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>已报名 45/100</span>
              </div>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
              立即报名
            </button>
          </div>
        </div>
      ))}
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
        {currentPage === 'create' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
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

      {/* 桌面端浮动按钮 */}
      {!isMobile && (
        <button className="hidden md:block fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}