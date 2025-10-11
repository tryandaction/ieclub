# IEclub 项目文档

## 项目概述
IEclub 是一个兴趣交流社区小程序，集成微信官方OCR插件，提供学生兴趣交流、活动组织、论坛讨论等功能。

## 技术栈
- **前端**: 微信小程序原生框架
- **后端**: Node.js + Express.js
- **数据库**: SQLite (开发环境) / PostgreSQL (生产环境)
- **ORM**: Sequelize
- **认证**: JWT Token
- **部署**: PM2 + Nginx

## 目录结构
```
/
├── pages/                 # 小程序页面
│   ├── index/            # 首页
│   ├── profile/          # 个人资料
│   ├── posts/            # 论坛
│   ├── events/           # 活动
│   ├── login/            # 登录
│   ├── ocr/              # OCR识别
│   ├── post-detail/      # 帖子详情
│   └── publish/          # 发布帖子
├── ieclub-backend/       # 后端API
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   └── package.json
└── ieclub-frontend/      # 前端项目
```

## 功能特性

### 小程序端
- ✅ 用户注册登录（微信授权）
- ✅ 帖子浏览、发布、评论
- ✅ 活动组织和参与
- ✅ OCR文字识别
- ✅ 用户个人资料管理
- ✅ 兴趣匹配推荐

### 后端API
- ✅ 用户管理系统
- ✅ 帖子管理系统
- ✅ 活动管理系统
- ✅ OCR服务集成
- ✅ 文件上传处理
- ✅ 微信小程序授权

## 部署指南

### 开发环境
```bash
# 后端启动
cd ieclub-backend
npm install
npm run dev

# 小程序开发
微信开发者工具导入项目
```

### 生产环境
```bash
# 后端部署
cd ieclub-backend
NODE_ENV=production npm start

# 或使用PM2
pm2 start src/server.js --name "ieclub-api"
```

## API接口文档

### 用户相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `GET /api/v1/users/profile` - 获取用户信息

### 帖子相关
- `GET /api/v1/posts` - 获取帖子列表
- `POST /api/v1/posts` - 创建帖子
- `GET /api/v1/posts/:id` - 获取帖子详情
- `POST /api/v1/posts/:id/like` - 点赞帖子

### 活动相关
- `GET /api/v1/events` - 获取活动列表
- `POST /api/v1/events` - 创建活动
- `POST /api/v1/events/:id/register` - 报名活动

## 配置说明

### 环境变量 (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=127.0.0.1
DB_NAME=ieclub_prod
JWT_SECRET=your-secret-key
WECHAT_MINIPROGRAM_APPID=your-appid
```

### 小程序配置 (app.json)
```json
{
  "pages": [
    "pages/index/index",
    "pages/profile/profile",
    "pages/posts/posts",
    "pages/events/events",
    "pages/login/login",
    "pages/ocr/ocr",
    "pages/post-detail/post-detail",
    "pages/publish/publish"
  ],
  "window": {
    "navigationBarTitleText": "IEclub",
    "backgroundColor": "#f8f9fa"
  }
}
```

## 开发规范

### 代码风格
- 使用ES6+语法
- 遵循Airbnb JavaScript风格指南
- 统一使用中文注释

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
```

## 故障排除

### 常见问题
1. **WXML编译错误**: 检查页面文件是否完整 (js/wxml/wxss)
2. **数据库连接失败**: 检查.env配置和数据库服务
3. **微信授权失败**: 检查小程序appid和secret配置

### 调试技巧
- 使用微信开发者工具的调试模式
- 查看后端控制台日志
- 使用Postman测试API接口

## 更新日志

### v1.0.0 (2025-01-11)
- 完成小程序基础框架
- 实现用户系统和帖子功能
- 集成OCR文字识别
- 完成前后端联调

## 联系方式
- 项目维护: IEclub Team
- 技术支持: [技术支持邮箱]

---
*本文档最后更新: 2025年10月11日*