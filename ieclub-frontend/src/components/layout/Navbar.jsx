import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Button } from '../common/Button.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Tooltip } from '../common/Tooltip.jsx';
import { Bell, Search } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const notifications = [
    { id: 1, type: 'like', user: '李思', content: '赞了你的帖子', time: '5分钟前', unread: true },
    { id: 2, type: 'comment', user: '王浩', content: '评论了你的帖子', time: '1小时前', unread: true },
    { id: 3, type: 'follow', user: '陈晓', content: '关注了你', time: '2小时前', unread: false }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-panel')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* MODIFICATION: Using <Link> for navigation, removed onClick */}
          <Link to="/" className="flex items-center gap-4 cursor-pointer group">
            <div className="text-3xl transform group-hover:scale-110 transition-transform">🎓</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IEclub
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">南方科技大学学生社区</p>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索帖子、活动、用户..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Tooltip content="通知">
                  <button 
                    className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors notification-panel"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell size={22} />
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      2
                    </span>
                  </button>
                </Tooltip>

                {showNotifications && (
                  <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border overflow-hidden z-50 notification-panel">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-bold text-lg">通知</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <Avatar src="👤" size="sm" />
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold">{notif.user}</span> {notif.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t">
                      <button className="text-blue-600 text-sm font-semibold hover:underline">查看全部</button>
                    </div>
                  </div>
                )}

                {/* MODIFICATION: Using navigate for navigation */}
                <div 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <Avatar src={user.avatar} size="sm" status="online" />
                  <span className="font-semibold text-gray-700 hidden lg:block">{user.username}</span>
                </div>
              </>
            ) : (
              <>
                {/* MODIFICATION: Using navigate for navigation */}
                <Button variant="ghost" onClick={() => navigate('/login')}>登录</Button>
                <Button variant="primary" onClick={() => navigate('/register')}>注册</Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
            </div>
          </button>
        </div>

        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 animate-slideDown">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
            {!isAuthenticated && (
              <div className="flex gap-2">
                {/* MODIFICATION: Using navigate for navigation */}
                <Button variant="ghost" onClick={() => navigate('/login')} className="flex-1">登录</Button>
                <Button variant="primary" onClick={() => navigate('/register')} className="flex-1">注册</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};