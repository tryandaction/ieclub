# IEclub Frontend - 项目结构详解

## 📁 完整目录结构

```
ieclub-frontend/
│
├── public/                          # 静态资源目录
│   ├── favicon.ico                  # 网站图标
│   ├── logo.png                     # Logo图片
│   ├── og-image.jpg                 # Open Graph 分享图片
│   └── robots.txt                   # 搜索引擎爬虫配置
│
├── src/                             # 源代码目录
│   │
│   ├── assets/                      # 资源文件
│   │   ├── images/                  # 图片资源
│   │   │   ├── avatars/            # 头像图片
│   │   │   ├── banners/            # Banner图片
│   │   │   └── icons/              # 图标
│   │   └── fonts/                   # 字体文件（可选）
│   │
│   ├── components/                  # 组件目录
│   │   │
│   │   ├── common/                  # 通用组件
│   │   │   ├── Button.jsx          # 按钮组件
│   │   │   ├── Input.jsx           # 输入框组件
│   │   │   ├── TextArea.jsx        # 文本域组件
│   │   │   ├── Modal.jsx           # 模态框组件
│   │   │   ├── Tag.jsx             # 标签组件
│   │   │   ├── Avatar.jsx          # 头像组件
│   │   │   ├── Tooltip.jsx         # 提示框组件
│   │   │   ├── Loading.jsx         # 加载组件
│   │   │   └── EmptyState.jsx      # 空状态组件
│   │   │
│   │   ├── layout/                  # 布局组件
│   │   │   ├── Navbar.jsx          # 导航栏
│   │   │   ├── Sidebar.jsx         # 侧边栏
│   │   │   ├── Footer.jsx          # 页脚
│   │   │   └── Container.jsx       # 容器组件
│   │   │
│   │   ├── post/                    # 帖子相关组件
│   │   │   ├── PostCard.jsx        # 帖子卡片
│   │   │   ├── PostList.jsx        # 帖子列表
│   │   │   ├── CreatePostModal.jsx # 创建帖子模态框
│   │   │   ├── PostDetail.jsx      # 帖子详情
│   │   │   └── CommentSection.jsx  # 评论区
│   │   │
│   │   ├── event/                   # 活动相关组件
│   │   │   ├── EventCard.jsx       # 活动卡片
│   │   │   ├── EventList.jsx       # 活动列表
│   │   │   ├── CreateEventModal.jsx # 创建活动模态框
│   │   │   └── EventDetail.jsx     # 活动详情
│   │   │
│   │   └── user/                    # 用户相关组件
│   │       ├── UserMatchCard.jsx   # 用户匹配卡片
│   │       ├── ProfileCard.jsx     # 个人资料卡片
│   │       └── UserStats.jsx       # 用户统计
│   │
│   ├── pages/                       # 页面组件
│   │   ├── auth/                    # 认证页面
│   │   │   ├── LoginPage.jsx       # 登录页
│   │   │   └── RegisterPage.jsx    # 注册页
│   │   │
│   │   ├── home/                    # 首页
│   │   │   └── HomePage.jsx        # 首页组件
│   │   │
│   │   ├── profile/                 # 个人主页
│   │   │   └── ProfilePage.jsx     # 个人主页组件
│   │   │
│   │   ├── events/                  # 活动页面
│   │   │   ├── EventsPage.jsx      # 活动列表页
│   │   │   └── EventDetailPage.jsx # 活动详情页
│   │   │
│   │   ├── match/                   # 匹配页面
│   │   │   └── MatchPage.jsx       # 兴趣匹配页
│   │   │
│   │   ├── leaderboard/             # 排行榜
│   │   │   └── LeaderboardPage.jsx
│   │   │
│   │   ├── bookmarks/               # 收藏
│   │   │   └── BookmarksPage.jsx
│   │   │
│   │   └── settings/                # 设置
│   │       └── SettingsPage.jsx
│   │
│   ├── services/                    # API服务
│   │   ├── api.js                  # Axios配置
│   │   ├── auth.service.js         # 认证服务
│   │   ├── post.service.js         # 帖子服务
│   │   ├── event.service.js        # 活动服务
│   │   ├── user.service.js         # 用户服务
│   │   └── ocr.service.js          # OCR服务
│   │
│   ├── store/                       # 状态管理
│   │   ├── authStore.js            # 认证状态
│   │   ├── postStore.js            # 帖子状态
│   │   ├── eventStore.js           # 活动状态
│   │   └── userStore.js            # 用户状态
│   │
│   ├── hooks/                       # 自定义Hooks
│   │   ├── useAuth.js              # 认证Hook
│   │   ├── usePosts.js             # 帖子Hook
│   │   ├── useEvents.js            # 活动Hook
│   │   ├── useDebounce.js          # 防抖Hook
│   │   └── useLocalStorage.js      # 本地存储Hook
│   │
│   ├── utils/                       # 工具函数
│   │   ├── constants.js            # 常量定义
│   │   ├── validators.js           # 表单验证
│   │   ├── formatters.js           # 格式化函数
│   │   ├── helpers.js              # 辅助函数
│   │   └── mockData.js             # 模拟数据
│   │
│   ├── App.jsx                      # 主应用组件
│   ├── main.jsx                     # 入口文件
│   └── index.css                    # 全局样式
│
├── .eslintrc.cjs                    # ESLint配置
├── .gitignore                       # Git忽略文件
├── .env                             # 环境变量（不提交）
├── .env.example                     # 环境变量示例
├── index.html                       # HTML模板
├── package.json                     # 项目配置
├── package-lock.json                # 依赖锁定
├── postcss.config.js                # PostCSS配置
├── tailwind.config.js               # Tailwind配置
├── vite.config.js                   # Vite配置
├── vercel.json                      # Vercel部署配置
├── README.md                        # 项目说明
├── PROJECT_STRUCTURE.md             # 项目结构说明（本文件）
└── setup.sh                         # 初始化脚本
```

## 📝 文件说明

### 根目录配置文件

#### package.json
项目的核心配置文件，包含：
- 项目元信息（名称、版本、描述）
- 依赖列表（dependencies 和 devDependencies）
- 脚本命令（scripts）
- 项目配置选项

#### vite.config.js
Vite 构建工具配置：
- 开发服务器设置（端口、代理）
- 构建选项（输出目录、代码分割）
- 插件配置（React插件）

#### tailwind.config.js
Tailwind CSS 配置：
- 内容路径（content）
- 主题扩展（colors、fonts、animations）
- 插件配置

#### postcss.config.js
PostCSS 配置：
- Tailwind CSS 插件
- Autoprefixer 插件

#### .eslintrc.cjs
ESLint 代码检查配置：
- 规则设置
- 插件配置
- 解析器选项

### 源代码文件

#### src/App.jsx
主应用组件，当前包含所有功能代码。未来可以重构为：
```javascript
// 推荐的重构结构
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/home/HomePage';
// ... 其他导入

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            {/* 更多路由 */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

#### src/main.jsx
应用入口文件：
- 挂载 React 应用到 DOM
- 导入全局样式
- React.StrictMode 包装

#### src/index.css
全局样式文件：
- Tailwind 指令
- 自定义动画
- 滚动条样式
- 全局CSS变量

## 🔄 组件拆分建议

当前 App.jsx 包含所有代码（约2000行），建议按以下方式拆分：

### 第一步：拆分通用组件
```bash
# 创建独立组件文件
src/components/common/Button.jsx
src/components/common/Input.jsx
src/components/common/Modal.jsx
src/components/common/Tag.jsx
src/components/common/Avatar.jsx
```

### 第二步：拆分布局组件
```bash
src/components/layout/Navbar.jsx
src/components/layout/Sidebar.jsx
```

### 第三步：拆分页面组件
```bash
src/pages/auth/LoginPage.jsx
src/pages/auth/RegisterPage.jsx
src/pages/home/HomePage.jsx
src/pages/profile/ProfilePage.jsx
```

### 第四步：提取服务和工具
```bash
src/services/api.js
src/utils/constants.js
src/utils/validators.js
```

## 🎯 开发最佳实践

### 1. 组件命名规范
- **组件文件**: PascalCase (例如: `UserCard.jsx`)
- **工具文件**: camelCase (例如: `formatDate.js`)
- **常量文件**: camelCase (例如: `constants.js`)

### 2. 导入顺序
```javascript
// 1. React 和第三方库
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. 内部组件
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

// 3. 工具和常量
import { API_BASE_URL } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';

// 4. 样式
import './styles.css';
```

### 3. 组件结构
```javascript
// 1. 导入
import React, { useState } from 'react';

// 2. 类型定义（如果使用TypeScript）
// interface Props { ... }

// 3. 常量
const DEFAULT_VALUE = 10;

// 4. 组件定义
const MyComponent = ({ prop1, prop2 }) => {
  // 5. 状态
  const [state, setState] = useState(null);
  
  // 6. 副作用
  useEffect(() => {
    // ...
  }, []);
  
  // 7. 事件处理
  const handleClick = () => {
    // ...
  };
  
  // 8. 渲染逻辑
  const renderContent = () => {
    // ...
  };
  
  // 9. 返回JSX
  return (
    <div>
      {renderContent()}
    </div>
  );
};

// 10. 导出
export default MyComponent;
```

### 4. 性能优化技巧
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useCallback` 和 `useMemo` 优化性能
- 大列表使用虚拟滚动（react-window）
- 路由懒加载：`React.lazy(() => import('./Component'))`

## 📦 依赖说明

### 核心依赖（dependencies）
| 包名 | 版本 | 用途 |
|------|------|------|
| react | ^18.2.0 | UI 框架 |
| react-dom | ^18.2.0 | DOM 渲染 |
| react-router-dom | ^6.20.0 | 路由管理 |
| axios | ^1.6.2 | HTTP 客户端 |
| lucide-react | ^0.294.0 | 图标库 |
| zustand | ^4.4.7 | 状态管理 |

### 开发依赖（devDependencies）
| 包名 | 版本 | 用途 |
|------|------|------|
| vite | ^5.0.8 | 构建工具 |
| @vitejs/plugin-react | ^4.2.1 | React 插件 |
| tailwindcss | ^3.3.6 | CSS 框架 |
| postcss | ^8.4.32 | CSS 处理 |
| autoprefixer | ^10.4.16 | CSS 前缀 |
| eslint | ^8.55.0 | 代码检查 |

## 🚀 下一步计划

1. **组件拆分**: 将 App.jsx 拆分为独立组件
2. **路由配置**: 使用 react-router-dom 配置路由
3. **API集成**: 连接后端API
4. **状态管理**: 使用 Zustand 统一管理状态
5. **测试**: 添加单元测试和集成测试
6. **优化**: 性能优化和SEO优化

## 🛠️ 工具函数示例

### src/utils/constants.js
```javascript
// API 路径
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    DETAIL: (id) => `/posts/${id}`,
  },
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    REGISTER: (id) => `/events/${id}/register`,
  },
};

// 南科大院系列表
export const DEPARTMENTS = [
  '计算机科学与工程系',
  '电子与电气工程系',
  '数学系',
  '物理系',
  '化学系',
  '生物系',
  '材料科学与工程系',
  '金融系',
  '商学院',
  '人文社科学院',
  '环境科学与工程学院',
  '海洋科学与工程系',
];

// 帖子分类
export const POST_CATEGORIES = [
  '学术讨论',
  '项目招募',
  '资源分享',
  '问答求助',
  '活动预告',
  '经验分享',
];

// 活动类型
export const EVENT_TYPES = [
  '学术讲座',
  '读书会',
  '工作坊',
  '社交活动',
  '项目路演',
  '技能培训',
];
```

### src/utils/validators.js
```javascript
// 邮箱验证
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@(sustech\.edu\.cn|mail\.sustech\.edu\.cn)$/;
  return regex.test(email);
};

// 密码验证（至少8位）
export const validatePassword = (password) => {
  return password.length >= 8;
};

// 用户名验证（3-20位）
export const validateUsername = (username) => {
  return username.length >= 3 && username.length <= 20;
};

// 表单验证
export const validateRegisterForm = (formData) => {
  const errors = {};
  
  if (!formData.username) {
    errors.username = '请输入用户名';
  } else if (!validateUsername(formData.username)) {
    errors.username = '用户名长度为3-20位';
  }
  
  if (!formData.email) {
    errors.email = '请输入邮箱';
  } else if (!validateEmail(formData.email)) {
    errors.email = '请使用南科大邮箱';
  }
  
  if (!formData.password) {
    errors.password = '请输入密码';
  } else if (!validatePassword(formData.password)) {
    errors.password = '密码至少8位';
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次密码不一致';
  }
  
  return errors;
};
```

### src/utils/formatters.js
```javascript
// 时间格式化
export const formatTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000); // 秒
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

// 数字格式化（1000 -> 1k）
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

// 截断文本
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
```

### src/utils/helpers.js
```javascript
// 生成唯一ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 深拷贝
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 从数组中随机选择
export const randomSelect = (array, count = 1) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
```

## 📋 任务清单

### 当前状态 ✅
- [x] 项目初始化
- [x] 基础UI组件开发
- [x] 页面布局完成
- [x] 用户认证流程
- [x] 帖子系统UI
- [x] 活动系统UI
- [x] 兴趣匹配UI
- [x] 个人主页UI
- [x] 响应式设计

### 待完成 🔲
- [ ] 组件代码拆分
- [ ] API服务封装
- [ ] 状态管理（Zustand）
- [ ] 图片上传功能
- [ ] 富文本编辑器集成
- [ ] 实时通知系统
- [ ] 搜索功能实现
- [ ] 数据持久化
- [ ] 错误边界处理
- [ ] 加载状态优化
- [ ] 单元测试
- [ ] E2E测试
- [ ] 性能监控
- [ ] SEO优化
- [ ] PWA支持
- [ ] 国际化（i18n）

## 💡 重构建议

### 1. 将App.jsx拆分为模块化结构

**步骤1: 创建Context**
```javascript
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('ieclub_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('ieclub_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ieclub_user');
  };

  const register = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      avatar: '👨‍💻',
      createdAt: new Date().toISOString(),
      reputation: 0,
      followers: 0,
      following: 0
    };
    login(newUser);
    return newUser;
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('ieclub_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      register, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**步骤2: 配置路由**
```javascript
// src/App.jsx (重构后)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/home/HomePage';
import EventsPage from './pages/events/EventsPage';
import MatchPage from './pages/match/MatchPage';
import ProfilePage from './pages/profile/ProfilePage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import BookmarksPage from './pages/bookmarks/BookmarksPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 受保护的路由 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="trending" element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="match" element={
              <ProtectedRoute>
                <MatchPage />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="bookmarks" element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

**步骤3: 创建布局组件**
```javascript
// src/components/layout/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
```

### 2. API服务封装示例

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ieclub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ieclub_token');
      localStorage.removeItem('ieclub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// src/services/auth.service.js
import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// src/services/post.service.js
import api from './api';

export const postService = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  commentPost: (id, data) => api.post(`/posts/${id}/comments`, data),
};
```

## 📊 性能优化检查清单

- [ ] 代码分割（React.lazy）
- [ ] 图片懒加载
- [ ] 虚拟滚动（长列表）
- [ ] Memoization（React.memo、useMemo、useCallback）
- [ ] 压缩静态资源
- [ ] CDN部署
- [ ] Service Worker
- [ ] 预加载关键资源
- [ ] Tree Shaking
- [ ] 减少包体积

## 🔐 安全检查清单

- [ ] XSS防护
- [ ] CSRF防护
- [ ] SQL注入防护（后端）
- [ ] 输入验证
- [ ] 输出转义
- [ ] HTTPS强制
- [ ] JWT安全存储
- [ ] 敏感信息加密
- [ ] 权限控制
- [ ] 速率限制

## 📱 移动端优化

- [ ] 触摸友好的按钮大小
- [ ] 移动端导航菜单
- [ ] 手势支持
- [ ] 响应式图片
- [ ] 减少动画（提升性能）
- [ ] 离线支持（PWA）
- [ ] 移动端特定优化

---

**最后更新**: 2025-01-03  
**维护者**: IEclub Team  
**文档版本**: v1.0