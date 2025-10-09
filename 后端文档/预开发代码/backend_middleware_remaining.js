// ========== middleware/upload.js ==========
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 导出multer实例
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
  },
  fileFilter: fileFilter
});


// ========== middleware/errorHandler.js ==========
const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
module.exports = (err, req, res, next) => {
  // 记录错误日志
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Sequelize数据库错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
      errors: err.errors.map(e => ({
        field: e.path,
        message: `${e.path}已被使用`
      }))
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的Token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: 'Token已过期'
    });
  }

  // Multer文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超出限制'
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传失败',
      error: err.message
    });
  }

  // 自定义错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};


// ========== middleware/rateLimiter.js ==========
const rateLimit = require('express-rate-limit');

// 通用限流器
exports.generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 最多100请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 认证接口限流（更严格）
exports.authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  skipSuccessfulRequests: true // 成功的请求不计入限制
});

// 注册接口限流
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册尝试
  message: {
    code: 429,
    message: '注册次数过多，请1小时后再试'
  }
});

// 文件上传限流
exports.uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次上传
  message: {
    code: 429,
    message: '上传次数过多，请稍后再试'
  }
});

// OCR接口限流（消耗资源较大）
exports.ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 30, // 最多30次
  message: {
    code: 429,
    message: 'OCR识别次数过多，请1小时后再试'
  }
});


// ========== middleware/validator.js ==========
const { body, param, query, validationResult } = require('express-validator');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');

/**
 * 验证结果处理
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * 注册验证规则
 */
exports.registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确')
    .custom(validateEmail).withMessage('仅支持南科大邮箱'),
  body('password')
    .custom(validatePassword).withMessage('密码至少8位'),
  body('username')
    .trim()
    .custom(validateUsername).withMessage('用户名长度应在3-20位之间'),
  body('studentId')
    .trim()
    .matches(/^\d{8}$/).withMessage('学号格式不正确（8位数字）')
];

/**
 * 登录验证规则
 */
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
];

/**
 * 创建帖子验证规则
 */
exports.createPostValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('标题长度应在1-200字之间'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 }).withMessage('内容长度应在1-10000字之间'),
  body('category')
    .trim()
    .isIn(['学术', '生活', '活动', '求助', '分享', '其他']).withMessage('分类不正确')
];

/**
 * 创建活动验证规则
 */
exports.createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('标题长度应在1-200字之间'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('描述长度应在1-5000字之间'),
  body('location')
    .trim()
    .notEmpty().withMessage('地点不能为空'),
  body('startTime')
    .isISO8601().withMessage('开始时间格式不正确')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('开始时间必须在未来');
      }
      return true;
    }),
  body('endTime')
    .isISO8601().withMessage('结束时间格式不正确')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('结束时间必须在开始时间之后');
      }
      return true;
    }),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('参与人数应在1-1000之间')
];

/**
 * 更新用户信息验证规则
 */
exports.updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .custom(validateUsername).withMessage('用户名长度应在3-20位之间'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('个人简介不能超过500字'),
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('专业名称过长'),
  body('grade')
    .optional()
    .trim()
    .matches(/^\d{4}$/).withMessage('年级格式不正确（4位数字）')
];

/**
 * ID参数验证
 */
exports.idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID必须是正整数')
];

/**
 * 分页参数验证
 */
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量应在1-100之间')
];


// ========== middleware/cache.js (可选，使用Redis) ==========
const Redis = require('ioredis');

// 创建Redis客户端
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis连接成功');
});

/**
 * 缓存中间件
 * @param {Number} duration - 缓存时长（秒）
 */
exports.cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // 仅对GET请求使用缓存
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // 保存原始的res.json方法
      const originalJson = res.json.bind(res);

      // 重写res.json方法以缓存响应
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('缓存错误:', error);
      next();
    }
  };
};

/**
 * 清除缓存
 */
exports.clearCache = async (pattern = '*') => {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
};

exports.redis = redis;
