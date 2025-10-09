# IEclub Backend API

## 📋 项目简介

IE Club 学生交流论坛后端API系统，提供完整的用户认证、帖子管理、活动发布、兴趣匹配和OCR识别功能。

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0 (可选，用于缓存)
- npm >= 8.0.0

### 2. 安装步骤

```bash
# 克隆项目
git clone <your-repo-url>
cd ieclub-backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入你的配置
nano .env
```

### 3. 数据库设置

```bash
# 创建PostgreSQL数据库
createdb ieclub

# 或者使用psql
psql -U postgres
CREATE DATABASE ieclub;
\q

# 运行数据库迁移（如果有）
npm run db:migrate
```

### 4. 启动服务器

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

服务器将在 `http://localhost:5000` 启动

## 📁 项目结构

```
ieclub-backend/
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.js      # 数据库配置
│   │   └── jwt.js           # JWT配置
│   │
│   ├── controllers/         # 控制器
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── eventController.js
│   │   ├── matchController.js
│   │   └── ocrController.js
│   │
│   ├── middleware/          # 中间件
│   │   ├── auth.js          # 认证中间件
│   │   ├── errorHandler.js  # 错误处理
│   │   ├── rateLimiter.js   # 限流
│   │   └── upload.js        # 文件上传
│   │
│   ├── models/              # 数据模型
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Event.js
│   │   ├── Comment.js
│   │   └── index.js
│   │
│   ├── routes/              # 路由
│   │   ├── index.js         # 主路由
│   │   ├── auth.js          # 认证路由
│   │   ├── user.routes.js   # 用户路由
│   │   ├── post.routes.js   # 帖子路由
│   │   ├── event.routes.js  # 活动路由
│   │   ├── match.routes.js  # 匹配路由
│   │   └── ocr.routes.js    # OCR路由
│   │
│   ├── services/            # 业务逻辑
│   │   ├── authService.js
│   │   ├── uploadService.js
│   │   ├── ocrService.js
│   │   └── matchService.js
│   │
│   ├── utils/               # 工具函数
│   │   ├── logger.js        # 日志工具
│   │   └── validators.js    # 验证工具
│   │
│   ├── app.js               # Express应用配置
│   └── server.js            # 服务器入口
│
├── logs/                    # 日志文件
├── uploads/                 # 上传文件
├── tests/                   # 测试文件
├── .env                     # 环境变量
├── .env.example             # 环境变量模板
├── .gitignore               # Git忽略文件
├── package.json             # 项目配置
└── README.md                # 项目文档
```

## 🔧 环境变量配置

在 `.env` 文件中配置以下变量：

### 必需配置

```bash
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT密钥（请务必修改）
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# 服务器
PORT=5000
NODE_ENV=development
```

### 可选配置

```bash
# 阿里云OSS（用于图片存储）
ALI_OSS_REGION=oss-cn-shenzhen
ALI_OSS_ACCESS_KEY_ID=your_key
ALI_OSS_ACCESS_KEY_SECRET=your_secret
ALI_OSS_BUCKET=ieclub

# 邮件服务
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ieclub.com
SMTP_PASSWORD=your_email_password

# Redis缓存
REDIS_HOST=localhost
REDIS_PORT=6379

# 百度OCR
BAIDU_OCR_APP_ID=your_app_id
BAIDU_OCR_API_KEY=your_api_key
BAIDU_OCR_SECRET_KEY=your_secret_key
```

## 📡 API接口文档

### 基础URL

- 开发环境: `http://localhost:5000/api/v1`
- 生产环境: `https://api.yourdomain.com/api/v1`

### 认证接口

#### 1. 注册
```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "password": "password123",
  "username": "张三",
  "studentId": "12012345"
}
```

**响应:**
```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "email": "student@sustech.edu.cn",
    "username": "张三"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 2. 登录
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "password": "password123"
}
```

#### 3. 获取当前用户
```http
GET /auth/me
Authorization: Bearer <token>
```

### 用户接口

#### 1. 获取用户信息
```http
GET /users/:id
```

#### 2. 更新个人信息
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "新昵称",
  "bio": "个人简介",
  "major": "计算机科学",
  "grade": "2023",
  "interests": ["编程", "音乐", "旅游"],
  "skills": ["Python", "JavaScript", "React"]
}
```

#### 3. 上传头像
```http
POST /users/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

#### 4. 搜索用户
```http
GET /users/search?q=张三&major=计算机&grade=2023
```

### 帖子接口

#### 1. 获取帖子列表
```http
GET /posts?page=1&limit=20&category=学术&sort=latest
```

**参数:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `category`: 分类（可选）
- `sort`: 排序方式（latest最新/hot热门）

#### 2. 获取单个帖子
```http
GET /posts/:id
```

#### 3. 创建帖子
```http
POST /posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: 帖子标题
content: 帖子内容
category: 学术
tags: ["Python", "机器学习"]
images: <files>
```

#### 4. 更新帖子
```http
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

#### 5. 删除帖子
```http
DELETE /posts/:id
Authorization: Bearer <token>
```

#### 6. 点赞/取消点赞
```http
POST /posts/:id/like
Authorization: Bearer <token>
```

#### 7. 收藏/取消收藏
```http
POST /posts/:id/bookmark
Authorization: Bearer <token>
```

#### 8. 获取评论
```http
GET /posts/:id/comments
```

#### 9. 添加评论
```http
POST /posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "评论内容"
}
```

### 活动接口

#### 1. 获取活动列表
```http
GET /events?page=1&limit=20&status=upcoming
```

**参数:**
- `status`: upcoming即将开始 / ongoing进行中 / past已结束

#### 2. 创建活动
```http
POST /events
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: 活动标题
description: 活动描述
location: 活动地点
startTime: 2025-10-10T14:00:00Z
endTime: 2025-10-10T16:00:00Z
maxParticipants: 50
tags: ["讲座", "学术"]
cover: <file>
```

#### 3. 报名活动
```http
POST /events/:id/register
Authorization: Bearer <token>
```

#### 4. 取消报名
```http
DELETE /events/:id/register
Authorization: Bearer <token>
```

#### 5. 活动签到
```http
POST /events/:id/checkin
Authorization: Bearer <token>
```

### 匹配接口

#### 1. 获取推荐好友
```http
GET /match/recommendations
Authorization: Bearer <token>
```

**响应:**
```json
{
  "recommendations": [
    {
      "user": {
        "id": 2,
        "username": "李四",
        "avatar": "https://...",
        "major": "计算机科学",
        "interests": ["编程", "音乐"]
      },
      "matchScore": 0.85,
      "commonInterests": ["编程", "音乐"]
    }
  ]
}
```

#### 2. 发送好友请求
```http
POST /match/connect/:userId
Authorization: Bearer <token>
```

#### 3. 接受好友请求
```http
POST /match/accept/:requestId
Authorization: Bearer <token>
```

#### 4. 获取好友列表
```http
GET /match/connections
Authorization: Bearer <token>
```

### OCR接口

#### 1. 识别图片文字
```http
POST /ocr/recognize
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

**响应:**
```json
{
  "text": "识别出的文字内容...",
  "confidence": 0.95,
  "language": "CHN_ENG"
}
```

#### 2. 获取OCR历史
```http
GET /ocr/history
Authorization: Bearer <token>
```

## 🔒 认证说明

大部分API需要JWT认证。在请求头中包含：

```http
Authorization: Bearer <your_jwt_token>
```

Token在登录或注册成功后返回，有效期7天。

## 📊 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "code": 400,
  "message": "错误描述",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
```

常见状态码：
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器错误

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 🚀 部署到阿里云

### 1. 准备服务器

购买阿里云ECS服务器（推荐配置：2核4GB）

```bash
# 连接服务器
ssh root@your_server_ip

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib

# 安装PM2（进程管理器）
npm install -g pm2
```

### 2. 配置PostgreSQL

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE ieclub;
CREATE USER ieclub_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ieclub TO ieclub_user;
\q
```

### 3. 部署代码

```bash
# 克隆代码
git clone <your-repo-url> /var/www/ieclub-backend
cd /var/www/ieclub-backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 使用PM2启动
pm2 start src/server.js --name ieclub-api
pm2 save
pm2 startup
```

### 4. 配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/ieclub
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 配置SSL证书（免费）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 6. 配置防火墙

```bash
# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📈 监控和日志

### 查看PM2日志

```bash
# 查看实时日志
pm2 logs ieclub-api

# 查看错误日志
pm2 logs ieclub-api --err

# 监控状态
pm2 monit
```

### 应用日志

日志文件位于 `logs/` 目录：
- `combined.log` - 所有日志
- `error.log` - 错误日志

## 🔧 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确：
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub
DB_USER=your_user
DB_PASSWORD=your_password
```

### 2. JWT认证失败

确保 `JWT_SECRET` 已设置且足够复杂：
```bash
JWT_SECRET=your_very_long_and_random_secret_key
```

### 3. 文件上传失败

检查上传目录权限：
```bash
mkdir -p uploads
chmod 755 uploads
```

### 4. 端口被占用

修改 `.env` 中的端口号：
```bash
PORT=5001
```

## 📞 技术支持

如有问题，请：
1. 查看日志文件
2. 检查环境变量配置
3. 确认数据库连接
4. 查看API文档

## 📄 许可证

MIT License

---

**开发者**: IE Club Team  
**最后更新**: 2025-10-02  
**版本**: 1.0.0