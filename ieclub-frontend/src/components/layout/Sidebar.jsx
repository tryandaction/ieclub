import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Button } from '../common/Button.jsx';
import { Home, Users, Calendar, User, LogOut, TrendingUp, Award, BookOpen, Shield, School } from 'lucide-react';

export const Sidebar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', path: '/', icon: Home, label: '首页', badge: null },
    { id: 'trending', path: '/trending', icon: TrendingUp, label: '热门', badge: 'HOT' },
    { id: 'events', path: '/events', icon: Calendar, label: '活动', badge: null },
    { id: 'match', path: '/match', icon: Users, label: '兴趣匹配', badge: 'NEW' },
    { id: 'leaderboard', path: '/leaderboard', icon: Award, label: '排行榜', badge: null },
  ];

  const userMenuItems = [
    { id: 'profile', path: '/profile', icon: User, label: '我的主页' },
    { id: 'bookmarks', path: '/bookmarks', icon: BookOpen, label: '我的收藏' },
    { id: 'settings', path: '/settings', icon: Shield, label: '设置' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:block w-64 space-y-2">
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} size="md" status="online" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{user.username}</p>
                <p className="text-sm text-gray-500 truncate">{user.major}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="font-bold text-gray-800">{user.followers || 0}</p>
                <p className="text-xs text-gray-500">粉丝</p>
              </div>
              <div className="text-center border-l border-r">
                <p className="font-bold text-gray-800">{user.following || 0}</p>
                <p className="text-xs text-gray-500">关注</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{user.reputation || 0}</p>
                <p className="text-xs text-gray-500">声望</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">加入IEclub社区</p>
            <Button variant="primary" onClick={() => navigate('/register')} className="w-full">
              立即注册
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {menuItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} />
              {item.label}
            </div>
            {item.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-white text-blue-600`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {isAuthenticated && (
        <>
          <div className="border-t my-4"></div>
          <div className="space-y-1">
            {userMenuItems.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => 
                  `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-white transition-all ${
                    isActive ? 'text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={20} className="text-gray-500" />
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-white hover:bg-red-50 text-red-600 transition-all"
            >
              <LogOut size={20} />
              退出登录
            </button>
          </div>
        </>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <School size={20} className="text-blue-600" />
          <p className="font-bold text-gray-800">校区交流</p>
        </div>
        <p className="text-sm text-gray-600 mb-3">即将支持跨校区、跨学校交流功能</p>
        <Button variant="outline" className="w-full text-sm">了解更多</Button>
      </div>
    </aside>
  );
};