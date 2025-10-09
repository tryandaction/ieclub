// ==================== 使用示例和集成说明 ====================

/*
========================================
📋 如何使用这些优化工具
========================================

1. 在控制器中使用统一响应格式：
----------------------------------
const { success, error, paginate } = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return error(res, '用户不存在', 404);
  }
  return success(res, user, '获取成功');
});

exports.getPosts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = PaginationHelper.calculate(req.query.page, req.query.limit);
  const { rows, count } = await Post.findAndCountAll({ limit, offset });
  return paginate(res, rows, count, page, limit);
});


2. 添加内容过滤：
----------------------------------
const contentFilter = require('../utils/contentFilter');

exports.createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  
  // 检查敏感词
  if (contentFilter.containsSensitiveWords(title) || contentFilter.containsSensitiveWords(content)) {
    return error(res, '内容包含敏感词，请修改', 400);
  }
  
  const post = await Post.create({
    title: contentFilter.filterText(title),
    content: contentFilter.filterText(content),
    userId: req.user.id
  });
  
  return success(res, post, '发布成功', 201);
});


3. 添加缓存：
----------------------------------
const cache = require('../utils/cache');

// 缓存热门帖子（10分钟）
router.get('/hot', cache.middleware(600), asyncHandler(async (req, res) => {
  const posts = await Post.findAll({
    order: [['likeCount', 'DESC']],
    limit: 10
  });
  return success(res, posts);
}));


4. 在 app.js 中集成性能监控：
----------------------------------
const performanceMonitor = require('./middleware/performance');
const requestLogger = require('./middleware/requestLogger');

// 请求日志
app.use(requestLogger);

// 性能监控
app.use(performanceMonitor.middleware());

// 性能指标接口
app.get('/metrics', (req, res) => {
  res.json(performanceMonitor.getSystemMetrics());
});


5. 添加图片压缩（需要先安装 sharp）：
----------------------------------
// npm install sharp

const imageCompressor = require('../utils/imageCompressor');

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, '请上传图片', 400);
  }
  
  // 压缩图片
  let avatarUrl;
  if (req.file.mimetype.startsWith('image/')) {
    const compressedPath = req.file.path.replace(/\.\w+$/, '_compressed.jpg');
    await imageCompressor.compress(req.file.path, compressedPath, {
      width: 400,
      height: 400,
      quality: 85
    });
    avatarUrl = `/uploads/avatars/${path.basename(compressedPath)}`;
  }
  
  await req.user.update({ avatar: avatarUrl });
  return success(res, { avatar: avatarUrl }, '头像上传成功');
});


6. 使用验证工具：
----------------------------------
const Validator = require('../utils/validator');

exports.register = asyncHandler(async (req, res) => {
  const rules = {
    email: { required: true, type: 'email' },
    password: { 
      required: true, 
      minLength: 8,
      custom: (value) => {
        if (!Validator.isStrongPassword(value)) {
          return '密码需包含大小写字母和数字';
        }
      }
    },
    username: { required: true, minLength: 3, maxLength: 20 }
  };
  
  const errors = Validator.validateFields(req.body, rules);
  if (errors.length > 0) {
    return error(res, '验证失败', 400, errors);
  }
  
  // 继续注册逻辑...
});


7. 使用常量配置：
----------------------------------
const { POST_CATEGORIES, ERROR_MESSAGES } = require('../config/constants');

if (!Object.values(POST_CATEGORIES).includes(category)) {
  return error(res, '无效的分类', 400);
}


========================================
🚀 立即部署这些优化
========================================

1. 复制所有工具代码到对应文件
2. 在需要的控制器中导入使用
3. 在 app.js 中添加中间件
4. 重启服务器测试

这些工具都是独立的，可以逐个添加，不会影响现有功能！
*/










// ==================== src/utils/responseFormatter.js ====================
// 统一响应格式工具（立即可用）

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {String} message - 提示消息
 * @param {Number} statusCode - HTTP状态码
 */
exports.success = (res, data = null, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 * @param {Number} statusCode - HTTP状态码
 * @param {Array} errors - 详细错误信息
 */
exports.error = (res, message = '操作失败', statusCode = 400, errors = null) => {
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} data - 数据列表
 * @param {Number} total - 总数
 * @param {Number} page - 当前页
 * @param {Number} limit - 每页数量
 */
exports.paginate = (res, data, total, page, limit) => {
  res.status(200).json({
    success: true,
    code: 200,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    },
    timestamp: new Date().toISOString()
  });
};

// 在控制器中使用：
// const { success, error, paginate } = require('../utils/responseFormatter');
// return success(res, user, '用户创建成功', 201);
// return error(res, '用户已存在', 400);
// return paginate(res, posts, total, page, limit);


// ==================== src/utils/asyncHandler.js ====================
// 异步错误处理包装器（立即可用）

/**
 * 包装异步函数，自动捕获错误
 * 避免每个控制器都写 try-catch
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// 使用方法（在控制器中）：
// const asyncHandler = require('../utils/asyncHandler');
// 
// exports.getUser = asyncHandler(async (req, res) => {
//   const user = await User.findByPk(req.params.id);
//   if (!user) throw new Error('用户不存在');
//   res.json(user);
// });


// ==================== src/utils/contentFilter.js ====================
// 敏感词过滤（立即可用）

class ContentFilter {
  constructor() {
    this.sensitiveWords = [
      // 政治敏感词
      '敏感词1', '敏感词2',
      // 暴力相关
      '暴力词1', '暴力词2',
      // 色情相关
      '色情词1', '色情词2',
      // 可以从数据库或配置文件加载
    ];
    
    // 创建正则表达式
    this.wordRegex = new RegExp(
      this.sensitiveWords
        .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|'),
      'gi'
    );
  }

  /**
   * 检查是否包含敏感词
   */
  containsSensitiveWords(text) {
    if (!text) return false;
    return this.wordRegex.test(text);
  }

  /**
   * 替换敏感词为星号
   */
  filterText(text) {
    if (!text) return text;
    return text.replace(this.wordRegex, (match) => '*'.repeat(match.length));
  }

  /**
   * 获取匹配的敏感词列表
   */
  getMatches(text) {
    if (!text) return [];
    return text.match(this.wordRegex) || [];
  }

  /**
   * 添加新的敏感词
   */
  addWord(word) {
    if (!this.sensitiveWords.includes(word)) {
      this.sensitiveWords.push(word);
      // 重新构建正则
      this.wordRegex = new RegExp(
        this.sensitiveWords
          .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|'),
        'gi'
      );
    }
  }
}

module.exports = new ContentFilter();

// 使用方法（在控制器中）：
// const contentFilter = require('../utils/contentFilter');
// 
// if (contentFilter.containsSensitiveWords(content)) {
//   return res.status(400).json({ message: '内容包含敏感词' });
// }
// const filtered = contentFilter.filterText(content);


// ==================== src/utils/imageCompressor.js ====================
// 图片压缩工具（需要安装 sharp: npm install sharp）

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageCompressor {
  /**
   * 压缩图片
   * @param {String} inputPath - 输入文件路径
   * @param {String} outputPath - 输出文件路径
   * @param {Object} options - 压缩选项
   */
  async compress(inputPath, outputPath, options = {}) {
    const {
      width = 1200,
      height = 1200,
      quality = 80,
      format = 'jpeg'
    } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toFile(outputPath);

      // 删除原文件
      await fs.unlink(inputPath);
      
      return outputPath;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(inputPath, outputPath, size = 200) {
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover' })
      .toFile(outputPath);
    
    return outputPath;
  }

  /**
   * 批量压缩
   */
  async compressBatch(files, outputDir, options = {}) {
    const results = [];
    
    for (const file of files) {
      const outputPath = path.join(
        outputDir,
        `compressed_${path.basename(file)}`
      );
      
      const compressed = await this.compress(file, outputPath, options);
      results.push(compressed);
    }
    
    return results;
  }
}

module.exports = new ImageCompressor();

// 使用方法（在uploadService.js中）：
// const imageCompressor = require('../utils/imageCompressor');
// 
// if (file.mimetype.startsWith('image/')) {
//   const compressedPath = await imageCompressor.compress(
//     file.path,
//     file.path.replace(/\.\w+$/, '_compressed.jpg')
//   );
// }


// ==================== src/utils/pagination.js ====================
// 分页助手（立即可用）

class PaginationHelper {
  /**
   * 计算分页参数
   */
  static calculate(page = 1, limit = 20, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(
      Math.max(1, parseInt(limit) || 20),
      maxLimit
    );
    const offset = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset
    };
  }

  /**
   * 构建分页元数据
   */
  static buildMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
      firstPage: 1,
      lastPage: totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    };
  }

  /**
   * 游标分页辅助
   */
  static buildCursor(lastItem, cursorField = 'id') {
    return lastItem ? Buffer.from(
      JSON.stringify({
        [cursorField]: lastItem[cursorField],
        timestamp: lastItem.createdAt
      })
    ).toString('base64') : null;
  }

  /**
   * 解析游标
   */
  static parseCursor(cursor) {
    if (!cursor) return null;
    
    try {
      return JSON.parse(
        Buffer.from(cursor, 'base64').toString('utf8')
      );
    } catch {
      return null;
    }
  }
}

module.exports = PaginationHelper;

// 使用方法：
// const PaginationHelper = require('../utils/pagination');
// 
// const { page, limit, offset } = PaginationHelper.calculate(req.query.page, req.query.limit);
// const { rows, count } = await Post.findAndCountAll({ limit, offset });
// const meta = PaginationHelper.buildMeta(count, page, limit);
// res.json({ posts: rows, pagination: meta });


// ==================== src/middleware/requestLogger.js ====================
// 请求日志中间件（立即可用）

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求信息
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // 记录响应信息
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logLevel]('Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });

  next();
};

module.exports = requestLogger;

// 在 app.js 中使用：
// const requestLogger = require('./middleware/requestLogger');
// app.use(requestLogger);


// ==================== src/utils/validator.js ====================
// 通用验证工具（立即可用）

class Validator {
  /**
   * 验证邮箱
   */
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证南科大邮箱
   */
  static isSustechEmail(email) {
    const domains = ['sustech.edu.cn', 'mail.sustech.edu.cn'];
    return domains.some(domain => email.endsWith(`@${domain}`));
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password) {
    // 至少8位，包含大小写字母和数字
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password);
  }

  /**
   * 验证学号
   */
  static isStudentId(id) {
    // 8位数字
    return /^\d{8}$/.test(id);
  }

  /**
   * 验证URL
   */
  static isURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证手机号
   */
  static isPhoneNumber(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  /**
   * 清理和验证输入
   */
  static sanitize(input, type = 'string') {
    if (input === null || input === undefined) return null;
    
    switch (type) {
      case 'string':
        return String(input).trim();
      case 'number':
        return Number(input);
      case 'boolean':
        return Boolean(input);
      case 'array':
        return Array.isArray(input) ? input : [input];
      default:
        return input;
    }
  }

  /**
   * 批量验证
   */
  static validateFields(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // 必填检查
      if (rule.required && !value) {
        errors.push({
          field,
          message: `${field}不能为空`
        });
        continue;
      }

      // 类型检查
      if (value && rule.type) {
        if (rule.type === 'email' && !this.isEmail(value)) {
          errors.push({ field, message: '邮箱格式不正确' });
        }
        if (rule.type === 'phone' && !this.isPhoneNumber(value)) {
          errors.push({ field, message: '手机号格式不正确' });
        }
        if (rule.type === 'url' && !this.isURL(value)) {
          errors.push({ field, message: 'URL格式不正确' });
        }
      }

      // 长度检查
      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field}长度至少${rule.minLength}个字符`
        });
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field}长度不能超过${rule.maxLength}个字符`
        });
      }

      // 自定义验证
      if (value && rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({ field, message: customError });
        }
      }
    }

    return errors;
  }
}

module.exports = Validator;

// 使用方法：
// const Validator = require('../utils/validator');
// 
// const rules = {
//   email: { required: true, type: 'email' },
//   password: { required: true, minLength: 8 },
//   username: { required: true, minLength: 3, maxLength: 20 }
// };
// 
// const errors = Validator.validateFields(req.body, rules);
// if (errors.length > 0) {
//   return res.status(400).json({ errors });
// }


// ==================== src/config/constants.js ====================
// 常量配置（立即可用）

module.exports = {
  // 用户角色
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },

  // 帖子分类
  POST_CATEGORIES: {
    ACADEMIC: '学术',
    LIFE: '生活',
    EVENT: '活动',
    HELP: '求助',
    SHARE: '分享',
    OTHER: '其他'
  },

  // 活动状态
  EVENT_STATUS: {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // 好友请求状态
  CONNECTION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
  },

  // 文件上传限制
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 9,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
  },

  // 分页默认值
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // 缓存时间（秒）
  CACHE_TTL: {
    SHORT: 60,        // 1分钟
    MEDIUM: 300,      // 5分钟
    LONG: 3600,       // 1小时
    VERY_LONG: 86400  // 1天
  },

  // 错误消息
  ERROR_MESSAGES: {
    UNAUTHORIZED: '未授权，请先登录',
    FORBIDDEN: '没有权限执行此操作',
    NOT_FOUND: '请求的资源不存在',
    VALIDATION_ERROR: '数据验证失败',
    SERVER_ERROR: '服务器内部错误'
  },

  // 成功消息
  SUCCESS_MESSAGES: {
    CREATED: '创建成功',
    UPDATED: '更新成功',
    DELETED: '删除成功',
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '登出成功'
  }
};

// 使用方法：
// const { POST_CATEGORIES, ERROR_MESSAGES } = require('../config/constants');
// if (!POST_CATEGORIES[category]) {
//   return res.status(400).json({ message: '无效的分类' });
// }


// ==================== src/middleware/performance.js ====================
// 性能监控中间件（立即可用）

const logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.slowRequestThreshold = 1000; // 1秒
  }

  middleware() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();

      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
        const endMemory = process.memoryUsage();
        const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

        // 记录慢请求
        if (duration > this.slowRequestThreshold) {
          logger.warn('Slow Request Detected', {
            method: req.method,
            url: req.originalUrl,
            duration: `${duration.toFixed(2)}ms`,
            memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
            statusCode: res.statusCode
          });
        }

        // 记录性能指标
        req.performanceMetrics = {
          duration,
          memoryUsed,
          statusCode: res.statusCode
        };
      });

      next();
    };
  }

  // 获取系统性能信息
  getSystemMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        total: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        used: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`
      },
      cpu: {
        user: `${(cpuUsage.user / 1000000).toFixed(2)}ms`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}ms`
      },
      uptime: `${(process.uptime() / 60).toFixed(2)}min`
    };
  }
}

module.exports = new PerformanceMonitor();

// 在 app.js 中使用：
// const performanceMonitor = require('./middleware/performance');
// app.use(performanceMonitor.middleware());
// 
// // 添加性能监控端点
// app.get('/metrics', (req, res) => {
//   res.json(performanceMonitor.getSystemMetrics());
// });


// ==================== src/utils/cache.js ====================
// 简单内存缓存（立即可用，不需要Redis）

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  /**
   * 设置缓存
   * @param {String} key - 键
   * @param {*} value - 值
   * @param {Number} ttl - 过期时间（秒）
   */
  set(key, value, ttl = 300) {
    this.cache.set(key, value);
    
    if (ttl) {
      const expiresAt = Date.now() + ttl * 1000;
      this.ttls.set(key, expiresAt);
      
      // 自动清理
      setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * 获取缓存
   */
  get(key) {
    // 检查是否过期
    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * 删除缓存
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  /**
   * 检查是否存在
   */
  has(key) {
    return this.cache.has(key) && (!this.ttls.has(key) || Date.now() <= this.ttls.get(key));
  }

  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size;
  }

  /**
   * 缓存中间件
   */
  middleware(duration = 300) {
    return (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = `cache:${req.originalUrl}`;
      const cached = this.get(key);

      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        this.set(key, data, duration);
        return originalJson(data);
      };

      next();
    };
  }
}

module.exports = new SimpleCache();

// 使用方法：
// const cache = require('../utils/cache');
// 
// // 手动使用
// cache.set('user:1', userData, 300);
// const user = cache.get('user:1');
// 
// // 作为中间件
// router.get('/hot-posts', cache.middleware(600), getHotPosts);


// ==================== src/utils/rateLimiter.js ====================
// 简单限流器（不需要Redis）

class SimpleRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  /**
   * 检查是否超过限制
   * @param {String} identifier - 标识符（IP或用户ID）
   * @param {Number} max - 最大请求数
   * @param {Number} windowMs - 时间窗口（毫秒）
   */
  isRateLimited(identifier, max = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // 清理过期记录
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= max) {
      return {
        limited: true,
        remaining: 0,
        resetTime: validRequests[0] + windowMs
      };
    }

    // 记录本次请求
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      limited: false,
      remaining: max - validRequests.length,
      resetTime: now + windowMs
    };
  }

  /**
   * 重置某个标识符的限制
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * 清空所有记录
   */
  clear() {
    this.requests.clear();
  }

  /**
   * 中间件
   */
  middleware(options = {}) {
    const {
      max = 100,
      windowMs = 15 * 60 * 1000,
      message = '请求过于频繁，请稍后再试'
    } = options;

    return (req, res, next) => {
      const identifier = req.user?.id || req.ip;
      const result = this.isRateLimited(identifier, max, windowMs);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (result.limited) {
        return res.status(429).json({
          code: 429,
          message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }

      next();
    };
  }
}

module.exports = new SimpleRateLimiter();

// 使用方法：
// const rateLimiter = require('../utils/rateLimiter');
// 
// router.post('/api/posts', 
//   rateLimiter.middleware({ max: 10, windowMs: 60000 }), 
//   createPost
// );


