# IEclub 后端开发规划

## 技术栈选择

### 后端框架：Node.js + Express + PostgreSQL
**选择理由**：
- ✅ 与前端技术栈一致（JavaScript/TypeScript）
- ✅ 开发效率高，生态完善
- ✅ 适合小程序后端（统一API）
- ✅ PostgreSQL性能优异，支持JSON字段

### 替代方案（可选）：
- **Python FastAPI**: 性能更好，但需要额外学习
- **Java Spring Boot**: 企业级，但开发周期长
- **Go**: 性能最佳，但学习曲线陡峭

## 后端项目结构

```
ieclub-backend/
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.js      # 数据库配置
│   │   ├── jwt.js           # JWT配置
│   │   ├── upload.js        # 文件上传配置
│   │   └── ocr.js           # OCR服务配置
│   │
│   ├── middleware/          # 中间件
│   │   ├── auth.js          # 认证中间件
│   │   ├── validator.js     # 验证中间件
│   │   ├── errorHandler.js  # 错误处理
│   │   ├── rateLimiter.js   # 限流中间件
│   │   └── logger.js        # 日志中间件
│   │
│   ├── models/              # 数据模型
│   │   ├── User.js          # 用户模型
│   │   ├── Post.js          # 帖子模型
│   │   ├── Event.js         # 活动模型
│   │   ├── Comment.js       # 评论模型
│   │   └── index.js         # 模型导出
│   │
│   ├── controllers/         # 控制器
│   │   ├── authController.js    # 认证控制器
│   │   ├── userController.js    # 用户控制器
│   │   ├── postController.js    # 帖子控制器
│   │   ├── eventController.js   # 活动控制器
│   │   ├── commentController.js # 评论控制器
│   │   ├── matchController.js   # 匹配控制器
│   │   └── ocrController.js     # OCR控制器
│   │
│   ├── routes/              # 路由
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   ├── event.routes.js
│   │   ├── comment.routes.js
│   │   ├── match.routes.js
│   │   ├── ocr.routes.js
│   │   └── index.js
│   │
│   ├── services/            # 业务逻辑
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── ocrService.js
│   │   ├── matchService.js
│   │   ├── uploadService.js
│   │   └── notificationService.js
│   │
│   ├── utils/               # 工具函数
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── validators.js
│   │   ├── logger.js
│   │   └── helpers.js
│   │
│   ├── db/                  # 数据库
│   │   ├── migrations/      # 数据库迁移
│   │   ├── seeds/           # 种子数据
│   │   └── connection.js    # 数据库连接
│   │
│   ├── app.js               # Express应用
│   └── server.js            # 服务器入口
│
├── tests/                   # 测试文件
│   ├── unit/
│   └── integration/
│
├── .env.example             # 环境变量示例
├── .gitignore
├── package.json
├── README.md
└── ecosystem.config.js      # PM2配置
```

## 数据库设计（PostgreSQL）

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    school VARCHAR(100) DEFAULT '南方科技大学',
    department VARCHAR(100),
    major VARCHAR(100),
    grade VARCHAR(20),
    bio TEXT,
    skills JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    reputation INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 帖子表
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    tags JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 点赞表
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

-- 活动表
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    cover_image VARCHAR(500),
    tags JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'upcoming',
    registration_deadline TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活动报名表
CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered',
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_time TIMESTAMP,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(event_id, user_id)
);

-- 用户关系表
CREATE TABLE user_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    connection_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_user_id, connection_type)
);

-- OCR识别记录表
CREATE TABLE ocr_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_image_url VARCHAR(500) NOT NULL,
    ocr_text TEXT,
    edited_text TEXT,
    confidence_score DECIMAL(3,2),
    language VARCHAR(10) DEFAULT 'zh',
    status VARCHAR(20) DEFAULT 'processing',
    related_event_id INTEGER REFERENCES events(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- 通知表
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    related_id INTEGER,
    related_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 收藏表
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

-- 创建索引
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

## API接口设计

### 认证接口
```
POST   /api/auth/register          注册
POST   /api/auth/login             登录
POST   /api/auth/logout            登出
POST   /api/auth/refresh           刷新Token
POST   /api/auth/verify-email      邮箱验证
POST   /api/auth/forgot-password   忘记密码
POST   /api/auth/reset-password    重置密码
GET    /api/auth/me                获取当前用户
```

### 用户接口
```
GET    /api/users                  获取用户列表
GET    /api/users/:id              获取用户详情
PUT    /api/users/:id              更新用户信息
DELETE /api/users/:id              删除用户
GET    /api/users/:id/posts        获取用户帖子
GET    /api/users/:id/events       获取用户活动
GET    /api/users/:id/followers    获取粉丝列表
GET    /api/users/:id/following    获取关注列表
POST   /api/users/:id/follow       关注用户
DELETE /api/users/:id/follow       取消关注
```

### 帖子接口
```
GET    /api/posts                  获取帖子列表
POST   /api/posts                  创建帖子
GET    /api/posts/:id              获取帖子详情
PUT    /api/posts/:id              更新帖子
DELETE /api/posts/:id              删除帖子
POST   /api/posts/:id/like         点赞帖子
DELETE /api/posts/:id/like         取消点赞
GET    /api/posts/:id/comments     获取评论
POST   /api/posts/:id/comments     发表评论
POST   /api/posts/:id/bookmark     收藏帖子
DELETE /api/posts/:id/bookmark     取消收藏
```

### 活动接口
```
GET    /api/events                 获取活动列表
POST   /api/events                 创建活动
GET    /api/events/:id             获取活动详情
PUT    /api/events/:id             更新活动
DELETE /api/events/:id             删除活动
POST   /api/events/:id/register    报名活动
DELETE /api/events/:id/register    取消报名
GET    /api/events/:id/participants 获取参与者
POST   /api/events/:id/checkin     签到
POST   /api/events/:id/feedback    提交反馈
```

### 匹配接口
```
GET    /api/match/recommendations  获取推荐用户
GET    /api/match/calculate        计算匹配度
POST   /api/match/refresh          刷新推荐
```

### OCR接口
```
POST   /api/ocr/upload             上传图片识别
GET    /api/ocr/records            获取识别历史
GET    /api/ocr/records/:id        获取识别详情
PUT    /api/ocr/records/:id        更新识别内容
DELETE /api/ocr/records/:id        删除记录
```

### 通知接口
```
GET    /api/notifications          获取通知列表
PUT    /api/notifications/:id/read 标记已读
PUT    /api/notifications/read-all 全部已读
DELETE /api/notifications/:id      删除通知
```

### 搜索接口
```
GET    /api/search                 全局搜索
GET    /api/search/posts           搜索帖子
GET    /api/search/users           搜索用户
GET    /api/search/events          搜索活动
```

### 统计接口
```
GET    /api/stats/overview         总体统计
GET    /api/stats/leaderboard      排行榜
GET    /api/stats/user/:id         用户统计
```

## 接口响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 数据内容
  }
}
```

### 分页响应
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
```

## 部署架构（阿里云）

```
┌─────────────────────────────────────────┐
│         阿里云 ECS 服务器                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         Nginx (反向代理)         │   │
│  │  - SSL证书                       │   │
│  │  - 静态资源服务                  │   │
│  │  - API代理                       │   │
│  └──────────┬──────────────────────┘   │
│             │                           │
│  ┌──────────▼──────────┐  ┌──────────┐ │
│  │   前端静态文件       │  │   后端   │ │
│  │   (dist目录)        │  │  Node.js │ │
│  │                     │  │  (PM2)   │ │
│  └─────────────────────┘  └────┬─────┘ │
│                                 │       │
│              ┌──────────────────▼─────┐ │
│              │   PostgreSQL 数据库    │ │
│              │   (端口5432)          │ │
│              └───────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Redis (缓存/会话/队列)         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   阿里云OSS (图片/文件存储)      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

外部服务:
- 百度OCR API
- 阿里云邮件推送
- 阿里云CDN
```

## 小程序扩展方案

### 架构设计
```
┌─────────────┐    ┌─────────────┐
│   Web前端   │    │   小程序     │
│   (React)   │    │  (原生/Taro) │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └────────┬─────────┘
                │
         ┌──────▼──────┐
         │  统一API    │
         │  (Express)  │
         └─────────────┘
```

### 小程序特殊处理
1. **登录方式**
   - Web: 邮箱密码登录
   - 小程序: 微信登录 + 邮箱绑定

2. **文件上传**
   - 使用wx.uploadFile
   - 后端统一处理

3. **实时通知**
   - Web: WebSocket
   - 小程序: 模板消息

4. **分享功能**
   - Web: 分享链接
   - 小程序: 小程序码

## 下一步开发计划

### Phase 1: 后端基础 (2周)
- [ ] 项目初始化
- [ ] 数据库设计与迁移
- [ ] 基础认证系统
- [ ] 用户CRUD接口

### Phase 2: 核心功能 (3周)
- [ ] 帖子系统完整接口
- [ ] 活动系统完整接口
- [ ] 文件上传功能
- [ ] OCR服务集成

### Phase 3: 高级功能 (2周)
- [ ] 匹配推荐算法
- [ ] 通知系统
- [ ] 搜索功能
- [ ] 统计排行榜

### Phase 4: 优化部署 (1周)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 阿里云部署
- [ ] 域名配置SSL

### Phase 5: 小程序开发 (3周)
- [ ] 小程序UI开发
- [ ] 微信登录集成
- [ ] 功能适配
- [ ] 提交审核

## 总时间预估: 11周（约3个月）