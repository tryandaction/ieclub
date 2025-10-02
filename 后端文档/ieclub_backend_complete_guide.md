# IEclub 后端完整开发指南

# IEclub 后端完整开发指南

## 🎯 快速开始

### 1. 创建项目目录
```bash
mkdir ieclub-backend
cd ieclub-backend
npm init -y
```

### 2. 安装依赖
```bash
# 核心依赖
npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet

# 中间件
npm install express-rate-limit express-validator morgan compression

# 工具库
npm install axios nodemailer winston multer ali-oss ioredis

# 开发依赖
npm install -D nodemon jest supertest eslint
```

### 3. 创建目录结构
```bash
mkdir -p src/{config,middleware,models,controllers,routes,services,utils,db}
mkdir -p src/db/{migrations,seeds}
mkdir -p logs tests
```

## 📦 核心文件代码

### src/config/database.js
```javascript
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 50,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
};
```

### src/models/index.js
```javascript
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize, Sequelize),
  Post: require('./Post')(sequelize, Sequelize),
  Event: require('./Event')(sequelize, Sequelize),
  Comment: require('./Comment')(sequelize, Sequelize),
  Like: require('./Like')(sequelize, Sequelize),
  EventRegistration: require('./EventRegistration')(sequelize, Sequelize),
  UserConnection: require('./UserConnection')(sequelize, Sequelize),
  OCRRecord: require('./OCRRecord')(sequelize, Sequelize),
  Notification: require('./Notification')(sequelize, Sequelize),
  Bookmark: require('./Bookmark')(sequelize, Sequelize),
};

// 定义关联关系
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
```

### src/models/User.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url'
    },
    school: {
      type: DataTypes.STRING(100),
      defaultValue: '南方科技大学'
    },
    department: {
      type: DataTypes.STRING(100)
    },
    major: {
      type: DataTypes.STRING(100)
    },
    grade: {
      type: DataTypes.STRING(20)
    },
    bio: {
      type: DataTypes.TEXT
    },
    skills: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    interests: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    reputation: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    followersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'followers_count'
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'following_count'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin', 'moderator']]
      }
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login'
    }
  }, {
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Post, { foreignKey: 'authorId', as: 'posts' });
    User.hasMany(models.Event, { foreignKey: 'organizerId', as: 'events' });
    User.hasMany(models.Comment, { foreignKey: 'authorId', as: 'comments' });
    User.hasMany(models.Like, { foreignKey: 'userId', as: 'likes' });
    User.hasMany(models.EventRegistration, { foreignKey: 'userId', as: 'registrations' });
    User.hasMany(models.OCRRecord, { foreignKey: 'userId', as: 'ocrRecords' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
  };

  return User;
};
```

### src/models/Post.js
```javascript
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'author_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    category: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [['学术讨论', '项目招募', '资源分享', '问答求助', '活动预告', '经验分享']]
      }
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'like_count'
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comment_count'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    }
  }, {
    tableName: 'posts',
    indexes: [
      { fields: ['author_id'] },
      { fields: ['created_at'] },
      { fields: ['category'] }
    ]
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    Post.hasMany(models.Comment, { foreignKey: 'postId', as: 'comments' });
    Post.hasMany(models.Like, { foreignKey: 'targetId', as: 'likes' });
  };

  return Post;
};
```

### src/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // 获取token
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '令牌已过期'
      });
    }
    return res.status(500).json({
      code: 500,
      message: '认证失败'
    });
  }
};

// 可选认证（用户可能未登录）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['passwordHash'] }
      });
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// 管理员权限检查
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminMiddleware
};
```

### src/middleware/errorHandler.js
```javascript
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('错误:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors
    });
  }

  // Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      code: 409,
      message: '数据已存在',
      field: err.errors[0].path
    });
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### src/middleware/rateLimiter.js
```javascript
const rateLimit = require('express-rate-limit');

// 通用限流
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 登录限流（更严格）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  }
});

// 注册限流
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    code: 429,
    message: '注册请求过于频繁，请1小时后再试'
  }
});

// 上传限流
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    code: 429,
    message: '上传过于频繁，请稍后再试'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  uploadLimiter
};
```

### src/controllers/authController.js
```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateEmail, validatePassword } = require('../utils/validators');

// 注册
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, department, major, grade, interests } = req.body;

    // 验证邮箱
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        message: '请使用南科大邮箱注册',
        errors: [{ field: 'email', message: '必须使用@sustech.edu.cn或@mail.sustech.edu.cn邮箱' }]
      });
    }

    // 验证密码
    if (!validatePassword(password)) {
      return res.status(400).json({
        code: 400,
        message: '密码格式不正确',
        errors: [{ field: 'password', message: '密码至少8位' }]
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '该邮箱已被注册'
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await User.create({
      username,
      email,
      passwordHash,
      department,
      major,
      grade,
      interests: interests || [],
      school: '南方科技大学'
    });

    // 生成token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      department: user.department,
      major: user.major,
      grade: user.grade,
      school: user.school,
      interests: user.interests,
      reputation: user.reputation,
      followersCount: user.followersCount,
      followingCount: user.followingCount
    };

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 登录
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    // 生成token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // 返回用户信息
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      department: user.department,
      major: user.major,
      grade: user.grade,
      school: user.school,
      bio: user.bio,
      skills: user.skills,
      interests: user.interests,
      reputation: user.reputation,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      role: user.role
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      department: user.department,
      major: user.major,
      grade: user.grade,
      school: user.school,
      bio: user.bio,
      skills: user.skills,
      interests: user.interests,
      reputation: user.reputation,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      role: user.role
    };

    res.json({
      code: 200,
      message: 'success',
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
};
```

### src/routes/index.js
```javascript
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const eventRoutes = require('./event.routes');
const matchRoutes = require('./match.routes');
const ocrRoutes = require('./ocr.routes');

// 路由挂载
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/events', eventRoutes);
router.use('/match', matchRoutes);
router.use('/ocr', ocrRoutes);

module.exports = router;
```

### src/routes/auth.routes.js
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
```

### src/utils/logger.js
```javascript
const winston = require('winston');
const path = require('path');

const logDir = process.env.LOG_FILE_PATH || './logs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ieclub-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// 开发环境输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Morgan stream
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
```

### src/utils/validators.js
```javascript
// 验证南科大邮箱
exports.validateEmail = (email) => {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');
  const emailRegex = new RegExp(`^[^\\s@]+@(${allowedDomains.join('|')})# IEclub 后端完整开发指南

);
  return emailRegex.test(email);
};

// 验证密码（至少8位）
exports.validatePassword = (password) => {
  return password && password.length >= 8;
};

// 验证用户名（3-20位）
exports.validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};
```

## 🚀 启动步骤

### 1. 安装PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt-get install postgresql
sudo systemctl start postgresql

# 创建数据库
createdb ieclub
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入数据库密码等信息
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 测试API
```bash
# 注册用户
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@sustech.edu.cn",
    "password": "password123",
    "department": "计算机科学与工程系",
    "major": "计算机科学",
    "grade": "大三"
  }'

# 登录
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123"
  }'
```

## 📝 下一步开发任务

1. **完成剩余控制器**
   - postController.js
   - eventController.js  
   - userController.js
   - matchController.js
   - ocrController.js

2. **文件上传功能**
   - 集成阿里云OSS
   - 图片压缩和处理

3. **OCR服务集成**
   - 百度OCR API
   - 异步处理队列

4. **实时通知系统**
   - WebSocket集成
   - 推送通知

5. **搜索功能**
   - 全文搜索
   - 标签搜索

6. **部署配置**
   - PM2配置
   - Nginx配置
   - SSL证书

完整的控制器代码、路由和服务层代码需要继续开发。需要我继续吗？