import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';

// 导入移动端优化的UI组件
import MobileOptimizedUI from './MobileOptimizedUI.jsx';

// 导入拆分的所有组件和页面
import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';

import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';

import { HomePage } from './pages/home/HomePage.jsx';

import { EventsPage } from './pages/events/EventsPage.jsx';

import { MatchPage } from './pages/match/MatchPage.jsx';

import { ProfilePage } from './pages/profile/ProfilePage.jsx';

import { LeaderboardPage } from './pages/leaderboard/LeaderboardPage.jsx';
import { BookmarksPage } from './pages/bookmarks/BookmarksPage.jsx';
import { SettingsPage } from './pages/settings/SettingsPage.jsx';


// ==================== 状态管理 ====================
// 移至src/store/AuthContext.jsx

// ==================== 通用组件 ====================
// 移至src/components/common/ 目录下

// ==================== 布局组件 ====================
// 移至src/components/layout/ 目录下

// ==================== 认证页面 ====================
// 移至src/pages/auth/ 目录下

// ==================== 帖子组件 ====================
// 移至src/components/post/PostCard.jsx
// 移至src/components/post/CreatePostModal.jsx

// ==================== 首页 ====================
// 移至src/pages/home/HomePage.jsx

// ==================== 活动页面 ====================
// 移至src/pages/events/ 目录下

// ==================== 兴趣匹配页面 ====================
// 移至src/pages/match/ 目录下

// ==================== 个人主页 ====================
// 移至src/pages/profile/ 目录下

// ==================== 排行榜页面 ====================
// 移至src/pages/leaderboard/LeaderboardPage.jsx

// ==================== 收藏页面 ====================
// 移至src/pages/bookmarks/BookmarksPage.jsx

// ==================== 设置页面 ====================
// 移至src/pages/settings/SettingsPage.jsx




// ==================== 主应用 ====================

// 1. 定义主布局组件
// 这个组件包含了导航栏和侧边栏，<Outlet /> 是一个占位符，代表子页面将在这里显示
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet /> {/* 子页面会在这里渲染 */}
          </main>
        </div>
      </div>
    </div>
  );
};

// 2. 定义主应用组件，它现在是路由配置中心
function App() {
  const [isMobile, setIsMobile] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <BrowserRouter> {/* 启用路由功能 */}
      {isMobile ? (
        // 移动端使用优化的UI
        <MobileOptimizedUI />
      ) : (
        // 桌面端使用现有的布局
        <Routes> {/* 路由规则列表 */}

          {/* a. 不需要布局的页面 (登录页, 注册页) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* b. 使用主布局的页面 */}
          <Route path="/" element={<MainLayout />}>
            {/* 默认子路由，访问'/'时显示 */}
            <Route index element={<HomePage />} />
            {/* 其他子路由 */}
            <Route path="trending" element={<HomePage />} /> {/* 热门页也暂时使用首页组件 */}
            <Route path="events" element={<EventsPage />} />
            <Route path="match" element={<MatchPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* c. 如果用户访问了不存在的页面，自动跳转回首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
