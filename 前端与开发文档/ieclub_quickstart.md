# IEclub 快速启动指南 🚀

本指南将帮助你在5分钟内启动IEclub前端项目。

## 📋 前置要求

在开始之前，确保你的电脑已安装：

- ✅ **Node.js** 18.0.0 或更高版本
- ✅ **npm** 9.0.0 或更高版本
- ✅ **Git** （用于克隆项目）

### 检查版本

```bash
node -v   # 应该显示 v18.x.x 或更高
npm -v    # 应该显示 9.x.x 或更高
```

如果没有安装，请访问：
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

## 🎯 快速启动（5分钟）

### 方法1：使用自动化脚本（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your-username/ieclub-frontend.git
cd ieclub-frontend

# 2. 运行初始化脚本
chmod +x setup.sh
./setup.sh

# 3. 将 App.jsx 代码复制到 src/App.jsx

# 4. 启动开发服务器
npm run dev
```

### 方法2：手动设置

```bash
# 1. 克隆项目
git clone https://github.com/your-username/ieclub-frontend.git
cd ieclub-frontend

# 2. 安装依赖
npm install

# 3. 创建环境变量文件
cp .env.example .env

# 4. 将 App.jsx 代码复制到 src/App.jsx

# 5. 确保 src/index.css 和 src/main.jsx 已正确配置

# 6. 启动开发服务器
npm run dev
```

## 📁 必需的文件清单

确保以下文件存在且配置正确：

### ✅ 根目录文件
- `package.json` - 项目配置
- `vite.config.js` - Vite配置
- `tailwind.config.js` - Tailwind配置
- `postcss.config.js` - PostCSS配置
- `.eslintrc.cjs` - ESLint配置
- `.gitignore` - Git忽略文件
- `.env` - 环境变量（基于.env.example创建）

### ✅ src目录文件
- `src/App.jsx` - 主应用组件（包含所有功能代码）
- `src/main.jsx` - React入口文件
- `src/index.css` - 全局样式

### ✅ public目录
- `index.html` - HTML模板

## 🔧 配置文件内容

### 1. src/main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 2. src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 其他全局样式 */
```

### 3. index.html
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IEclub - 南方科技大学学生社区</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 🎨 验证安装

启动成功后，你应该看到：

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

打开浏览器访问 `http://localhost:3000`，你应该看到：
- ✅ 精美的登录/注册页面
- ✅ 完整的导航栏
- ✅ 响应式布局

## 🐛 常见问题排查

### 问题1: npm install 失败

**症状**: 安装依赖时报错

**解决方案**:
```bash
# 清除npm缓存
npm cache clean --force

# 删除锁文件和node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题2: 端口3000被占用

**症状**: 启动时提示端口已被使用

**解决方案**:
```bash
# 方法1: 修改端口（编辑 vite.config.js）
server: {
  port: 3001,  // 改为其他端口
}

# 方法2: 杀死占用端口的进程（Mac/Linux）
lsof -ti:3000 | xargs kill -9

# 方法2: 杀死占用端口的进程（Windows）
netstat -ano | findstr :3000
taskkill /PID <PID号> /F
```

### 问题3: Tailwind样式不生效

**症状**: 页面没有样式

**解决方案**:
```bash
# 1. 确保安装了Tailwind
npm install -D tailwindcss postcss autoprefixer

# 2. 确保 index.css 中有 Tailwind 指令
@tailwind base;
@tailwind components;
@tailwind utilities;

# 3. 确保 main.jsx 导入了 index.css
import './index.css'

# 4. 重启开发服务器
npm run dev
```

### 问题4: 找不到 lucide-react

**症状**: 启动时报错找不到图标组件

**解决方案**:
```bash
# 安装 lucide-react
npm install lucide-react

# 重启服务器
npm run dev
```

### 问题5: React版本冲突

**症状**: 出现React相关错误

**解决方案**:
```bash
# 确保使用正确的React版本
npm install react@^18.2.0 react-dom@^18.2.0

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📝 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行ESLint检查
npm run lint

# 查看包大小分析
npm run build -- --report
```

## 🎯 下一步

现在你已经成功启动了项目！接下来可以：

1. **探索功能**
   - 点击"注册"体验三步注册流程
   - 浏览首页查看帖子系统
   - 尝试创建活动
   - 查看兴趣匹配推荐

2. **开始开发**
   - 阅读 `PROJECT_STRUCTURE.md` 了解项目结构
   - 查看 `README.md` 了解完整文档
   - 开始编写你的第一个功能

3. **连接后端**
   - 修改 `.env` 文件中的 `VITE_API_BASE_URL`
   - 实现 API 服务调用
   - 测试数据交互

## 📚 相关文档

- [README.md](README.md) - 完整项目文档
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 项目结构详解
- [开发设计规划](开发设计规划文档.md) - 完整开发规划

## 🆘 获取帮助

如果遇到问题：

1. **查看文档** - 先查看上述相关文档
2. **搜索Issues** - [GitHub Issues](https://github.com/your-username/ieclub-frontend/issues)
3. **提交Issue** - 详细描述问题、环境、复现步骤
4. **联系我们** - support@ieclub.com

## ✨ 成功提示

如果看到以下内容，说明一切正常：

- ✅ 开发服务器成功启动（http://localhost:3000）
- ✅ 页面加载无错误
- ✅ 样式正常显示
- ✅ 点击交互正常工作
- ✅ 浏览器控制台无报错

**恭喜！你已经成功启动IEclub前端项目！** 🎉

开始你的开发之旅吧！

---

**最后更新**: 2025-01-03  
**问题反馈**: [GitHub Issues](https://github.com/your-username/ieclub-frontend/issues)