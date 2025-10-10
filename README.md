# 🎓 IEclub - 学生跨学科交流论坛

> 连接思想，激发创新 | 为学生打造的学术交流与协作平台

## 📋 项目简介

IEclub 是一个面向学生的跨学科交流论坛平台，旨在促进学术讨论、项目协作和社交匹配。平台不仅提供传统论坛功能，还集成了活动管理、智能匹配、OCR识别等创新功能，帮助学生找到志同道合的伙伴，分享知识和想法。

## ✨ 核心功能

### 📝 论坛系统
- **主题分类**：支持多学科话题分类
- **帖子发布**：富文本编辑、图片上传、标签系统
- **互动功能**：点赞、评论、收藏、分享
- **热门排序**：基于互动度的智能排序算法

### 🎪 活动管理
- **活动发布**：讲座、研讨会、工作坊等活动宣传
- **在线报名**：报名表单、人数限制、审核机制
- **活动日历**：可视化活动时间线
- **签到系统**：现场签到和积分奖励

### 👤 个人主页
- **展示中心**：项目作品集、技能标签、研究兴趣
- **动态更新**：个人学术动态和成就展示
- **自定义主题**：个性化页面设计
- **访客统计**：访问量和互动数据分析

### 🤝 智能匹配
- **兴趣匹配**：基于标签和行为的推荐算法
- **协作匹配**：项目需求与技能的智能对接
- **学习伙伴**：寻找同领域的学习伙伴
- **导师连接**：学长学姐经验分享

### 📸 OCR识别
- **PPT识别**：讲座现场拍照自动提取文字
- **笔记整理**：手写笔记数字化
- **多语言支持**：中英文混合识别
- **批量处理**：多图片并行识别

### 🔔 通知系统
- **实时推送**：评论、点赞、关注等即时通知
- **邮件提醒**：重要消息邮件通知
- **消息分类**：系统、互动、活动等分类管理
- **免打扰模式**：自定义通知规则

## 🏗️ 技术架构

### 前端技术栈
```
- 框架: React 18.x
- 状态管理: Redux Toolkit
- UI组件: Material-UI / Ant Design
- 路由: React Router v6
- 构建工具: Vite
- 样式: Tailwind CSS
- HTTP客户端: Axios
```

### 后端技术栈
```
- 运行环境: Node.js 18+
- Web框架: Express.js
- 数据库: PostgreSQL 14+
- ORM: Sequelize
- 缓存: Redis 7+
- 任务队列: Bull (Redis)
- 文件存储: 本地存储 / 阿里云OSS
- OCR服务: Tesseract.js / 百度OCR API
```

### 安全与监控
```
- 认证: JWT + bcrypt
- 加密: AES-256-GCM
- 内容安全: DFA算法 + 敏感词过滤
- 错误追踪: Sentry
- 日志系统: Winston
- 性能监控: Prometheus
- 限流: Redis + Express-rate-limit
```

## 📂 项目结构

```
ieclub/
├── frontend/                 # 前端项目
│   ├── public/              # 静态资源
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # Redux状态管理
│   │   ├── services/       # API服务
│   │   ├── utils/          # 工具函数
│   │   └── App.jsx         # 根组件
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器层
│   │   ├── models/         # 数据模型 (11个)
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件 (13个)
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数 (14个)
│   │   ├── config/         # 配置文件
│   │   ├── app.js          # Express应用
│   │   └── server.js       # 服务器入口
│   ├── tests/              # 测试文件
│   ├── logs/               # 日志目录
│   ├── uploads/            # 上传文件
│   ├── package.json
│   └── ecosystem.config.js  # PM2配置
│
├── docs/                    # 项目文档
├── .gitignore
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 7.0
- npm >= 9.0 或 yarn >= 1.22

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/yourusername/ieclub.git
cd ieclub
```

#### 2. 安装后端依赖
```bash
cd backend
npm install
```

#### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入以下配置：
# - 数据库连接信息
# - Redis连接信息  
# - JWT密钥
# - Sentry DSN
# - OCR API密钥等
```

#### 4. 初始化数据库
```bash
# 运行数据库迁移
npm run migrate

# 运行种子数据（可选）
npm run seed
```

#### 5. 启动后端服务
```bash
# 开发模式
npm run dev

# 生产模式
npm run start

# 使用PM2（推荐生产环境）
npm run pm2:start
```

#### 6. 安装前端依赖
```bash
cd ../frontend
npm install
```

#### 7. 启动前端开发服务器
```bash
npm run dev
```

#### 8. 访问应用
- **开发环境**:
  - 前端地址: http://localhost:5173
  - 后端API: http://localhost:5000/api/v1
  - 健康检查: http://localhost:5000/health

- **生产环境** (你的域名):
  - 前端地址: https://www.ieclub.online
  - 后端API: https://www.ieclub.online/api/v1
  - 健康检查: https://www.ieclub.online/health

## 📊 数据模型

### 核心模型（11个）

```javascript
User              // 用户模型
Post              // 帖子模型
Comment           // 评论模型
Like              // 点赞模型
Bookmark          // 收藏模型
Event             // 活动模型
EventRegistration // 活动报名模型
Notification      // 通知模型
UserConnection    // 用户关系模型
OCRRecord         // OCR识别记录
AuditLog          // 审计日志
```

## 🔌 API端点

### 认证相关
```
POST   /api/v1/auth/register      # 用户注册
POST   /api/v1/auth/login         # 用户登录
POST   /api/v1/auth/logout        # 用户登出
POST   /api/v1/auth/refresh       # 刷新Token
POST   /api/v1/auth/forgot-password  # 忘记密码
POST   /api/v1/auth/reset-password   # 重置密码
```

### 用户相关
```
GET    /api/v1/users/me           # 获取当前用户信息
PUT    /api/v1/users/me           # 更新用户信息
GET    /api/v1/users/:id          # 获取用户详情
GET    /api/v1/users/:id/posts    # 获取用户帖子
POST   /api/v1/users/:id/follow   # 关注用户
DELETE /api/v1/users/:id/follow   # 取消关注
```

### 帖子相关
```
GET    /api/v1/posts              # 获取帖子列表
POST   /api/v1/posts              # 创建帖子
GET    /api/v1/posts/:id          # 获取帖子详情
PUT    /api/v1/posts/:id          # 更新帖子
DELETE /api/v1/posts/:id          # 删除帖子
POST   /api/v1/posts/:id/like     # 点赞帖子
POST   /api/v1/posts/:id/bookmark # 收藏帖子
```

### 活动相关
```
GET    /api/v1/events             # 获取活动列表
POST   /api/v1/events             # 创建活动
GET    /api/v1/events/:id         # 获取活动详情
PUT    /api/v1/events/:id         # 更新活动
DELETE /api/v1/events/:id         # 删除活动
POST   /api/v1/events/:id/register # 报名活动
```

### OCR相关
```
POST   /api/v1/ocr/recognize      # OCR识别
GET    /api/v1/ocr/records        # 获取识别记录
```

### 匹配相关
```
GET    /api/v1/match/recommendations  # 获取推荐用户
GET    /api/v1/match/interests        # 获取兴趣匹配
```

## 🛡️ 安全特性

### 13层安全防护
1. **HTTPS强制**: 生产环境强制HTTPS
2. **Helmet安全头**: 设置安全HTTP头
3. **CORS配置**: 跨域请求控制
4. **SQL注入防护**: 参数化查询
5. **XSS防护**: 输入清理和输出转义
6. **CSRF防护**: Token验证
7. **限流保护**: IP级别和用户级别限流
8. **密码加密**: Bcrypt哈希
9. **JWT认证**: 安全的Token机制
10. **敏感数据加密**: AES-256-GCM加密
11. **内容审核**: DFA算法敏感词过滤
12. **文件上传安全**: 类型和大小限制
13. **审计日志**: 完整的操作日志记录

## 📈 性能指标

### 目标性能
- API响应时间: < 100ms (P95)
- 缓存命中率: > 90%
- 并发处理: > 1000 req/s
- 数据库查询: < 50ms (P95)
- 页面加载: < 2s (首屏)

### 优化策略
- Redis缓存热点数据
- 数据库索引优化
- 图片压缩和CDN加速
- Gzip压缩响应
- 数据分页和懒加载
- 防抖和节流
- 虚拟滚动列表

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 📦 部署

### 使用PM2部署
```bash
# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart ieclub

# 停止服务
pm2 stop ieclub
```

### 使用Docker部署
```bash
# 构建镜像
docker build -t ieclub .

# 运行容器
docker-compose up -d
```

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循Airbnb JavaScript风格指南
- 编写清晰的注释和文档
- 编写单元测试

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 开发团队

- **项目负责人**: [Your Name]
- **后端开发**: Claude AI + Development Team
- **前端开发**: Development Team
- **UI/UX设计**: Design Team

## 📞 联系方式

- **项目地址**: https://github.com/yourusername/ieclub
- **在线访问**: https://www.ieclub.online
- **问题反馈**: https://github.com/yourusername/ieclub/issues
- **邮箱**: contact@ieclub.com

## 🙏 致谢

感谢所有为本项目做出贡献的开发者和用户！

---

**IEclub** - 让学术交流更简单，让创新协作更高效 🚀

*Made with ❤️ by the IEclub Team*