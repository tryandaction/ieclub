# 🎯 IEclub 后端完整文件使用指南

## 📦 已生成的所有文件清单

### 核心代码文件（必需）

| 文件路径 | 说明 | 何时使用 |
|---------|------|---------|
| `src/server.js` | 服务器入口文件 | ✅ 现在 |
| `src/app.js` | Express应用配置 | ✅ 现在 |
| `src/config/database.js` | 数据库配置 | ✅ 现在 |
| `src/config/jwt.js` | JWT配置 | ✅ 现在 |

### 数据模型文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/models/index.js` | 模型导出入口 |
| `src/models/User.js` | 用户模型 |
| `src/models/Post.js` | 帖子模型 |
| `src/models/Event.js` | 活动模型 |
| `src/models/Comment.js` | 评论模型 |
| `src/models/Like.js` | 点赞模型 |
| `src/models/Bookmark.js` | 收藏模型 |
| `src/models/EventRegistration.js` | 活动报名模型 |
| `src/models/UserConnection.js` | 用户连接模型 |
| `src/models/OCRRecord.js` | OCR记录模型 |
| `src/models/Notification.js` | 通知模型 |

### 控制器文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/controllers/authController.js` | 认证控制器 |
| `src/controllers/userController.js` | 用户控制器 |
| `src/controllers/postController.js` | 帖子控制器 |
| `src/controllers/eventController.js` | 活动控制器 |
| `src/controllers/matchController.js` | 匹配控制器 |
| `src/controllers/ocrController.js` | OCR控制器 |

### 路由文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/routes/index.js` | 主路由 |
| `src/routes/auth.js` | 认证路由 |
| `src/routes/user.routes.js` | 用户路由 |
| `src/routes/post.routes.js` | 帖子路由 |
| `src/routes/event.routes.js` | 活动路由 |
| `src/routes/match.routes.js` | 匹配路由 |
| `src/routes/ocr.routes.js` | OCR路由 |

### 中间件文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/middleware/auth.js` | 认证中间件 |
| `src/middleware/errorHandler.js` | 错误处理 |
| `src/middleware/rateLimiter.js` | 限流中间件 |
| `src/middleware/validator.js` | 验证中间件 |
| `src/middleware/upload.js` | 文件上传 |
| `src/middleware/cache.js` | 缓存中间件（可选） |

### 服务层文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/services/authService.js` | 认证服务 |
| `src/services/uploadService.js` | 上传服务 |
| `src/services/ocrService.js` | OCR服务 |
| `src/services/matchService.js` | 匹配服务 |
| `src/services/emailService.js` | 邮件服务 |

### 工具文件（必需）

| 文件路径 | 说明 |
|---------|------|
| `src/utils/logger.js` | 日志工具 |
| `src/utils/validators.js` | 验证工具 |

### 配置文件

| 文件 | 说明 | 何时使用 |
|------|------|---------|
| `package.json` | 项目配置 | ✅ 现在 |
| `.env` | 环境变量（本地开发） | ✅ 现在 |
| `.env.example` | 环境变量模板 | ✅ 现在 |
| `.gitignore` | Git忽略文件 | ✅ 现在 |

### 部署配置文件（有服务器后使用）

| 文件 | 说明 | 何时使用 |
|------|------|---------|
| `ecosystem.config.js` | PM2配置 | 🔜 部署时 |
| `nginx.conf` | Nginx配置 | 🔜 部署时 |
| `.env.production` | 生产环境变量 | 🔜 部署时 |

### 启动脚本

| 文件 | 说明 | 适用系统 |
|------|------|---------|
| `local-setup.sh` | 自动设置脚本 | macOS/Linux |
| `local-setup.bat` | 自动设置脚本 | Windows |
| `start-dev.sh` | 启动脚本 | macOS/Linux |
| `start-dev.bat` | 启动脚本 | Windows |
| `test-api.sh` | 测试脚本 | macOS/Linux |
| `test-api.bat` | 测试脚本 | Windows |

### 文档文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目文档 |
| `快速启动指南.md` | 启动指南 |
| `项目总结.md` | 项目总结 |

---

## 🚀 快速开始（3步搞定）

### 方法1：自动设置（推荐）

#### macOS/Linux:
```bash
# 1. 下载自动设置脚本
chmod +x local-setup.sh

# 2. 运行脚本
./local-setup.sh

# 3. 复制代码文件到对应位置，然后启动
./start-dev.sh
```

#### Windows:
```bash
# 1. 双击运行
local-setup.bat

# 2. 复制代码文件到对应位置

# 3. 双击启动
start-dev.bat
```

### 方法2：手动设置

#### 第一步：环境准备
```bash
# 1. 安装 Node.js 18+
# https://nodejs.org

# 2. 安装 PostgreSQL 13+
# macOS: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt install postgresql

# 3. 创建数据库
psql -U postgres
CREATE DATABASE ieclub_dev;
\q
```

#### 第二步：项目初始化
```bash
# 1. 创建项目目录
mkdir ieclub-backend
cd ieclub-backend

# 2. 初始化项目
npm init -y

# 3. 安装依赖
npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet \
  express-rate-limit express-validator morgan compression \
  axios nodemailer winston multer ali-oss ioredis

npm install -D nodemon sequelize-cli

# 4. 创建目录结构
mkdir -p src/{config,middleware,models,controllers,routes,services,utils}
mkdir -p logs uploads tests
```

#### 第三步：复制文件

**将以下文件复制到对应位置：**

1. **核心文件**（必需，现在就复制）
   - ✅ `src/server.js`
   - ✅ `src/app.js`
   - ✅ `package.json`
   - ✅ `.env`
   - ✅ `.gitignore`

2. **配置文件**（必需）
   - ✅ `src/config/database.js`

3. **所有模型文件**（必需）
   - ✅ `src/models/` 下的所有文件

4. **所有控制器**（必需）
   - ✅ `src/controllers/` 下的所有文件

5. **所有路由**（必需）
   - ✅ `src/routes/` 下的所有文件

6. **所有中间件**（必需）
   - ✅ `src/middleware/` 下的所有文件

7. **所有服务**（必需）
   - ✅ `src/services/` 下的所有文件

8. **工具文件**（必需）
   - ✅ `src/utils/` 下的所有文件

#### 第四步：配置环境变量

编辑 `.env` 文件：
```bash
# 最重要的配置
DB_PASSWORD=你的PostgreSQL密码

# 其他配置使用默认值即可
NODE_ENV=development
PORT=5000
DB_NAME=ieclub_dev
```

#### 第五步：启动项目

```bash
# 开发模式（推荐）
npm run dev

# 或普通模式
npm start
```

看到以下信息表示成功：
```
✅ 数据库连接成功
✅ 数据库模型同步完成
🚀 服务器运行在端口 5000
```

---

## 📝 文件复制清单（重要！）

### ✅ 立即需要的文件（本地开发）

复制这些文件到对应位置：

```
ieclub-backend/
├── src/
│   ├── server.js                    ← 从 artifact "ieclub_backend_server_js"
│   ├── app.js                       ← 从 artifact "backend_app_complete"
│   │
│   ├── config/
│   │   └── database.js              ← 从之前生成的文件
│   │
│   ├── models/
│   │   ├── index.js                 ← 从 "backend_models_remaining"
│   │   ├── User.js                  ← 从之前生成的文件
│   │   ├── Post.js                  ← 从之前生成的文件
│   │   ├── Comment.js               ← 从之前生成的文件
│   │   ├── Event.js                 ← 从 "backend_models_remaining"
│   │   ├── Like.js                  ← 从 "backend_models_remaining"
│   │   ├── Bookmark.js              ← 从 "backend_models_remaining"
│   │   ├── EventRegistration.js    ← 从 "backend_models_remaining"
│   │   ├── UserConnection.js       ← 从 "backend_models_remaining"
│   │   ├── OCRRecord.js            ← 从 "backend_models_remaining"
│   │   └── Notification.js         ← 从 "backend_models_remaining"
│   │
│   ├── controllers/
│   │   ├── authController.js        ← 从之前生成的文件
│   │   ├── userController.js        ← 从 "backend_controllers_remaining"
│   │   ├── postController.js        ← 从 "backend_controllers_remaining"
│   │   ├── eventController.js       ← 从 "backend_controllers_events_match_ocr"
│   │   ├── matchController.js       ← 从 "backend_controllers_events_match_ocr"
│   │   └── ocrController.js         ← 从 "backend_controllers_events_match_ocr"
│   │
│   ├── routes/
│   │   ├── index.js                 ← 从之前生成的文件
│   │   ├── auth.js                  ← 从之前生成的文件
│   │   ├── user.routes.js           ← 从 "backend_routes_remaining"
│   │   ├── post.routes.js           ← 从 "backend_routes_remaining"
│   │   ├── event.routes.js          ← 从 "backend_routes_remaining"
│   │   ├── match.routes.js          ← 从 "backend_routes_remaining"
│   │   └── ocr.routes.js            ← 从 "backend_routes_remaining"
│   │
│   ├── middleware/
│   │   ├── auth.js                  ← 从之前生成的文件
│   │   ├── errorHandler.js          ← 从 "backend_middleware_remaining"
│   │   ├── rateLimiter.js           ← 从 "backend_middleware_remaining"
│   │   ├── validator.js             ← 从 "backend_middleware_remaining"
│   │   ├── upload.js                ← 从 "backend_middleware_remaining"
│   │   └── cache.js                 ← 从 "backend_middleware_remaining" (可选)
│   │
│   ├── services/
│   │   ├── uploadService.js         ← 从 "backend_services"
│   │   ├── ocrService.js            ← 从 "backend_services"
│   │   ├── matchService.js          ← 从 "backend_services"
│   │   └── emailService.js          ← 从 "backend_services"
│   │
│   └── utils/
│       ├── logger.js                ← 从之前生成的文件
│       └── validators.js            ← 从之前生成的文件
│
├── package.json                     ← 从 "backend_package_json"
├── .env                             ← 从 "backend_env_example"（重命名）
├── .gitignore                       ← 自动生成或手动创建
└── README.md                        ← 从 "backend_readme"
```

### 🔜 部署时需要的文件（有服务器后）

```
├── ecosystem.config.js              ← 从 "deployment_configs"
├── nginx.conf                       ← 从 "deployment_configs"
└── .env.production                  ← 从 "deployment_configs"
```

---

## 🧪 测试验证

### 1. 测试健康检查
```bash
curl http://localhost:5000/health
```

**预期响应：**
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T...",
  "uptime": 10.5,
  "environment": "development"
}
```

### 2. 测试用户注册
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123",
    "username": "测试用户",
    "studentId": "12012345"
  }'
```

**预期响应：**
```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "email": "test@sustech.edu.cn",
    "username": "测试用户"
  },
  "token": "eyJhbGc..."
}
```

### 3. 测试用户登录
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123"
  }'
```

---

## 🐛 常见问题解决

### 问题1：数据库连接失败

**错误信息：**
```
❌ 数据库连接失败
Error: password authentication failed
```

**解决方法：**
```bash
# 1. 检查PostgreSQL是否运行
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Windows:
# 打开"服务"，查找PostgreSQL

# 2. 检查密码
# 修改 .env 文件中的 DB_PASSWORD

# 3. 重置PostgreSQL密码（如果忘记）
psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_password';
```

### 问题2：端口被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**解决方法：**
```bash
# 方法1：修改端口
# 编辑 .env 文件，改为 PORT=5001

# 方法2：关闭占用端口的程序
# macOS/Linux:
lsof -i :5000
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### 问题3：模块找不到

**错误信息：**
```
Error: Cannot find module 'express'
```

**解决方法：**
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 问题4：数据库表不存在

**错误信息：**
```
relation "users" does not exist
```

**解决方法：**
```bash
# 开发环境会自动同步，如果没有：
# 1. 确保 NODE_ENV=development
# 2. 重启服务器，会自动创建表
npm run dev
```

---

## 📊 开发进度检查

### ✅ 第一阶段：环境搭建（1天）
- [ ] 安装 Node.js
- [ ] 安装 PostgreSQL
- [ ] 创建项目目录
- [ ] 安装依赖
- [ ] 配置环境变量
- [ ] 创建数据库

### ✅ 第二阶段：代码部署（1天）
- [ ] 复制所有代码文件
- [ ] 验证文件结构
- [ ] 启动服务器
- [ ] 测试基础API

### ⏳ 第三阶段：功能测试（3-5天）
- [ ] 测试用户注册登录
- [ ] 测试帖子CRUD
- [ ] 测试活动功能
- [ ] 测试匹配算法
- [ ] 测试文件上传
- [ ] 测试OCR功能

### ⏳ 第四阶段：前端开发（1-2周）
- [ ] 创建React项目
- [ ] 连接后端API
- [ ] 开发页面组件
- [ ] 前后端联调

### 🔜 第五阶段：部署上线（最后）
- [ ] 购买域名
- [ ] 购买服务器
- [ ] 配置生产环境
- [ ] 部署代码
- [ ] 配置Nginx
- [ ] 申请SSL证书
- [ ] 正式上线

---

## 🎯 总结

### 现在就可以开始开发！

**您已经拥有：**
- ✅ 完整的后端代码（100%完成）
- ✅ 清晰的文件结构
- ✅ 详细的使用文档
- ✅ 自动化启动脚本
- ✅ 本地开发配置

**立即行动：**
1. 运行自动设置脚本（或手动设置）
2. 复制所有代码文件
3. 启动服务器
4. 开始测试API
5. 开发前端界面

**部署相关（暂时不用管）：**
- ❌ 域名（等开发完成后购买）
- ❌ 服务器（等开发完成后购买）
- ❌ 阿里云OSS（等开发完成后配置）
- ❌ 百度OCR（等开发完成后申请）

---

## 📞 需要帮助？

如果遇到问题：
1. 查看错误日志：`tail -f logs/error.log`
2. 检查环境变量：确认 `.env` 配置正确
3. 验证数据库：确认PostgreSQL运行正常
4. 查看文档：参考 README.md 和项目总结

**祝开发顺利！🚀**