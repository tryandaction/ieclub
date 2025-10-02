# IEclub - 南方科技大学学生社区

<div align="center">
  <img src="public/logo.png" alt="IEclub Logo" width="120"/>
  <p><strong>跨学科交流 · 学术共享 · 找到志同道合的伙伴</strong></p>
</div>

## 📖 项目简介

IEclub是专为南方科技大学学生打造的跨学科交流平台。我们致力于打破学科壁垒，促进学术交流，帮助学生找到志同道合的伙伴，共同探索创新。

### 核心功能

- 🎓 **学术论坛** - 发布帖子、讨论问题、分享资源
- 📅 **活动管理** - 创建活动、在线报名、人数限制
- 🤝 **兴趣匹配** - 智能推荐志同道合的同学
- 👤 **个人主页** - 展示项目、管理资料、建立声望
- 📸 **OCR识别** - 上传讲座照片，自动识别文字
- 🏆 **排行榜** - 声望榜、贡献榜激励活跃用户

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/ieclub-frontend.git
cd ieclub-frontend
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建文件将输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
ieclub-frontend/
├── public/              # 静态资源
│   ├── favicon.ico
│   └── logo.png
├── src/                 # 源代码
│   ├── components/      # 组件目录（未来扩展）
│   │   ├── common/      # 通用组件
│   │   ├── layout/      # 布局组件
│   │   └── ...
│   ├── pages/           # 页面组件（未来扩展）
│   ├── services/        # API服务（未来扩展）
│   ├── store/           # 状态管理（未来扩展）
│   ├── utils/           # 工具函数（未来扩展）
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── .eslintrc.cjs        # ESLint配置
├── .gitignore           # Git忽略文件
├── index.html           # HTML入口
├── package.json         # 项目配置
├── postcss.config.js    # PostCSS配置
├── tailwind.config.js   # Tailwind配置
├── vite.config.js       # Vite配置
└── README.md            # 项目说明
```

## 🛠️ 技术栈

### 前端框架
- **React 18** - 用户界面库
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架

### 核心依赖
- **react-router-dom** - 路由管理
- **axios** - HTTP客户端
- **lucide-react** - 图标库
- **zustand** - 轻量级状态管理

### 开发工具
- **ESLint** - 代码检查
- **PostCSS** - CSS处理
- **Autoprefixer** - 自动添加CSS前缀

## 🎨 设计特色

### 视觉设计
- 现代化渐变配色（蓝色→紫色→粉色）
- 流畅的动画效果（淡入、滑动、悬停）
- 玻璃态设计风格
- 完全响应式布局

### 用户体验
- 三步注册流程
- 实时反馈（点赞、收藏、关注）
- 智能推荐算法
- 加载状态提示

### 南科大特色
- 强制南科大邮箱注册 (@sustech.edu.cn)
- 院系选择器（12个院系）
- 校园文化融入
- 跨校交流预告功能

## 📝 开发规范

### 代码风格
- 使用 ESLint 进行代码检查
- 遵循 React 官方编码规范
- 组件命名使用 PascalCase
- 函数命名使用 camelCase
- 常量命名使用 UPPER_SNAKE_CASE

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具变动
```

### 组件开发规范
```javascript
// 1. 导入依赖
import React, { useState } from 'react';

// 2. 定义组件
const MyComponent = ({ prop1, prop2 }) => {
  // 3. 状态定义
  const [state, setState] = useState(initialValue);

  // 4. 副作用
  useEffect(() => {
    // ...
  }, []);

  // 5. 事件处理
  const handleClick = () => {
    // ...
  };

  // 6. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. 导出
export default MyComponent;
```

## 🔧 配置说明

### Tailwind CSS 配置
项目使用 Tailwind CSS 进行样式管理，自定义配置包括：
- 南科大品牌色
- 自定义动画
- 响应式断点
- 字体配置

### Vite 配置
- 端口：3000
- 自动打开浏览器
- API代理：`/api` → `http://localhost:5000`
- 代码分割优化

### 环境变量（可选）
创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=IEclub
```

## 🌐 API 对接

### API 基础配置
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
    const token = localStorage.getItem('token');
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
      // 处理未授权
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API 调用示例
```javascript
// 用户注册
import api from './services/api';

const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};
```

## 📱 部署指南

### Vercel 部署（推荐）

1. 安装 Vercel CLI
```bash
npm install -g vercel
```

2. 登录并部署
```bash
vercel login
vercel --prod
```

### Netlify 部署

1. 构建项目
```bash
npm run build
```

2. 上传 `dist` 目录到 Netlify

### 服务器部署（Nginx）

1. 构建项目
```bash
npm run build
```

2. Nginx 配置
```nginx
server {
    listen 80;
    server_name ieclub.sustech.edu.cn;
    root /var/www/ieclub/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 常见问题

### 1. 安装依赖失败
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 2. 端口被占用
修改 `vite.config.js` 中的端口号：
```javascript
server: {
  port: 3001, // 改为其他端口
}
```

### 3. Tailwind 样式不生效
确保 `index.css` 已正确导入：
```javascript
// main.jsx
import './index.css'
```

### 4. 构建后刷新404
确保服务器配置了 SPA 路由重定向到 `index.html`

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交 Issue
- 详细描述问题
- 提供复现步骤
- 附上截图或错误信息

### 提交 Pull Request
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码审查标准
- 代码符合 ESLint 规范
- 有必要的注释
- 通过所有测试
- 不破坏现有功能

## 📊 性能优化

### 已实施的优化
- ✅ 代码分割（React vendor、Router、Icons）
- ✅ 懒加载图片
- ✅ 响应式图片
- ✅ CSS 压缩
- ✅ Tree Shaking

### 待优化项
- [ ] 虚拟滚动（长列表）
- [ ] Service Worker（PWA）
- [ ] 图片懒加载组件
- [ ] 路由懒加载
- [ ] 缓存策略优化

## 🔐 安全措施

- ✅ XSS 防护（React 自动转义）
- ✅ CSRF Token（后端实现）
- ✅ HTTPS 强制（生产环境）
- ✅ 输入验证（前后端双重）
- ✅ JWT Token 认证

## 📈 待开发功能

### V1.1（短期）
- [ ] 私信功能
- [ ] 消息中心优化
- [ ] 帖子草稿箱
- [ ] 图片上传预览
- [ ] 表情包支持

### V1.2（中期）
- [ ] 实时聊天
- [ ] 视频通话
- [ ] 学习小组
- [ ] 课程表分享
- [ ] 二手交易

### V2.0（长期）
- [ ] 移动端 App
- [ ] 多校区互联
- [ ] AI 学习助手
- [ ] 知识图谱
- [ ] 企业招聘对接

## 📞 联系我们

- 项目地址：[GitHub](https://github.com/your-username/ieclub-frontend)
- 问题反馈：[Issues](https://github.com/your-username/ieclub-frontend/issues)
- 邮箱：support@ieclub.com
- 官网：https://ieclub.sustech.edu.cn

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 鸣谢

感谢以下开源项目：
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

<div align="center">
  <p>Made with ❤️ by IEclub Team</p>
  <p>© 2025 IEclub. All rights reserved.</p>
</div>