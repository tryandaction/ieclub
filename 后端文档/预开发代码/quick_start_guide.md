# IEclub 快速启动指南 🚀

## 📦 第一步：环境准备

### 安装必需软件

```bash
# 1. 安装Node.js (v16+)
# 访问 https://nodejs.org 下载安装

# 2. 安装PostgreSQL (v13+)
# macOS:
brew install postgresql
brew services start postgresql

# Windows:
# 访问 https://www.postgresql.org/download/windows/

# Ubuntu/Linux:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# 3. 验证安装
node --version  # 应该显示 v16.0.0 或更高
npm --version   # 应该显示 8.0.0 或更高
psql --version  # 应该显示 PostgreSQL 13 或更高
```

## 🔧 第二步：后端设置

### 1. 创建项目并安装依赖

```bash
# 创建项目目录
mkdir ieclub-backend
cd ieclub-backend

# 初始化npm项目
npm init -y

# 安装所有依赖
npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet \
  express-rate-limit express-validator morgan compression \
  axios nodemailer winston multer ali-oss ioredis

# 安装开发依赖
npm install -D nodemon jest supertest eslint
```

### 2. 创建目录结构

```bash
# 创建必要的目录
mkdir -p src/{config,middleware,models,controllers,routes,services,utils}
mkdir -p logs uploads tests

# 创建核心文件
touch src/server.js
touch src/app.js
touch .env
touch .gitignore
```

### 3. 配置数据库

```bash
# 启动PostgreSQL并创建数据库
psql -U postgres

# 在psql命令行中执行：
CREATE DATABASE ieclub;
CREATE USER ieclub_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ieclub TO ieclub_user;
\q
```

### 4. 配置环境变量

创建 `.env` 文件：

```bash
# 复制并编辑
cat > .env << 'EOF'
# 服务器配置
NODE_ENV=development
PORT=5000
API_VERSION=v1

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub
DB_USER=ieclub_user
DB_PASSWORD=your_password
DB_POOL_MAX=20
DB_POOL_MIN=2

# JWT配置（请修改为复杂密钥）
JWT_SECRET=change_this_to_a_very_long_random_string_in_production
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# 邮箱配置（暂时可以留空）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ieclub.com
SMTP_PASSWORD=

# 允许的邮箱域名
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# 限流配置
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW=15
AUTH_RATE_LIMIT_MAX=5

# 前端URL
FRONTEND_URL=http://localhost:3000
EOF
```

### 5. 将之前生成的所有代码文件复制到相应位置

**重要文件清单：**
- `src/server.js` - 服务器入口
- `src/app.js` - Express应用配置
- `src/config/database.js` - 数据库配置
- `src/models/` - 所有模型文件
- `src/controllers/` - 所有控制器
- `src/routes/` - 所有路由
- `src/middleware/` - 所有中间件
- `src/services/` - 所有服务
- `src/utils/` - 工具函数

### 6. 更新 package.json

```json
{
  "name": "ieclub-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  }
}
```

### 7. 启动后端服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

**成功启动后会看到：**
```
✅ 数据库连接成功
✅ 数据库模型同步完成
🚀 服务器运行在端口 5000
📊 环境: development
🌐 健康检查: http://localhost:5000/health
📡 API地址: http://localhost:5000/api/v1
```

## 🎨 第三步：前端设置

### 1. 创建React项目

```bash
# 在另一个终端窗口
cd ..
npm create vite@latest ieclub-frontend -- --template react
cd ieclub-frontend
npm install
```

### 2. 安装前端依赖

```bash
npm install axios react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. 配置Tailwind CSS

编辑 `tailwind.config.js`：

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

编辑 `src/index.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. 创建API服务

创建 `src/services/api.js`：

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 认证API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

// 用户API
export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  searchUsers: (params) => api.get('/users/search', { params })
};

// 帖子API
export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPostById: (id) => api.get(`/posts/${id}`),
  createPost: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images' && data[key]) {
        data[key].forEach(file => formData.append('images', file));
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    });
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content })
};

// 活动API
export const eventAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'cover') {
        formData.append('cover', data[key]);
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    });
    return api.post('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  registerEvent: (id) => api.post(`/events/${id}/register`),
  unregisterEvent: (id) => api.delete(`/events/${id}/register`)
};

// 匹配API
export const matchAPI = {
  getRecommendations: () => api.get('/match/recommendations'),
  sendConnectionRequest: (userId) => api.post(`/match/connect/${userId}`),
  acceptConnection: (requestId) => api.post(`/match/accept/${requestId}`),
  getConnections: () => api.get('/match/connections')
};

// OCR API
export const ocrAPI = {
  recognizeText: (file, accurate = false) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('accurate', accurate);
    return api.post('/ocr/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getHistory: (params) => api.get('/ocr/history', { params })
};

export default api;
```

### 5. 启动前端

```bash
npm run dev
```

访问 `http://localhost:5173`

## ✅ 测试接口

### 使用curl测试

```bash
# 1. 健康检查
curl http://localhost:5000/health

# 2. 注册用户
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123",
    "username": "测试用户",
    "studentId": "12012345"
  }'

# 3. 登录
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123"
  }'

# 保存返回的token，然后：
# 4. 获取当前用户信息
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 使用Postman测试

1. 导入接口集合
2. 设置环境变量 `baseUrl = http://localhost:5000/api/v1`
3. 测试各个接口

## 🐛 常见问题排查

### 1. 数据库连接失败

```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# 重启PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql  # macOS

# 检查数据库是否存在
psql -U postgres -l
```

### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 修改端口
# 在.env文件中修改 PORT=5001
```

### 3. npm安装失败

```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 4. 查看日志

```bash
# 后端日志
tail -f logs/combined.log
tail -f logs/error.log

# PM2日志（如果使用PM2）
pm2 logs ieclub-api
```

## 📈 下一步

1. **完善功能**: 实现所有业务逻辑
2. **添加测试**: 编写单元测试和集成测试
3. **优化性能**: 添加Redis缓存
4. **配置CI/CD**: 自动化部署
5. **准备上线**: 购买服务器和域名

## 🚀 部署到阿里云

准备就绪后，参考 `README.md` 中的部署指南，将应用部署到阿里云服务器。

---

**恭喜！您的IEclub后端已经完全配置好了！** 🎉

现在可以开始开发前端页面，连接后端API，构建完整的应用了！