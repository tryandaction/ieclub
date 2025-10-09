// ==================== src/middleware/security.js ====================
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * 安全中间件配置
 */
class SecurityMiddleware {
  /**
   * Helmet安全头配置
   */
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'same-origin' }
    });
  }

  /**
   * XSS防护
   */
  static xssProtection() {
    return xss();
  }

  /**
   * NoSQL注入防护
   */
  static noSqlInjectionProtection() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`NoSQL injection attempt detected: ${key}`);
      }
    });
  }

  /**
   * HTTP参数污染防护
   */
  static hppProtection() {
    return hpp({
      whitelist: ['sort', 'fields', 'page', 'limit']
    });
  }

  /**
   * IP白名单/黑名单
   */
  static ipFilter(options = {}) {
    const { whitelist = [], blacklist = [] } = options;

    return (req, res, next) => {
      const clientIp = req.ip || req.connection.remoteAddress;

      // 黑名单检查
      if (blacklist.length > 0 && blacklist.includes(clientIp)) {
        return res.status(403).json({
          code: 403,
          message: '访问被拒绝'
        });
      }

      // 白名单检查
      if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
        return res.status(403).json({
          code: 403,
          message: '未授权的IP地址'
        });
      }

      next();
    };
  }

  /**
   * CSRF保护
   */
  static csrfProtection() {
    const tokens = new Map();

    return {
      generateToken: (req, res, next) => {
        const token = require('crypto').randomBytes(32).toString('hex');
        tokens.set(req.session?.id || req.ip, token);
        res.locals.csrfToken = token;
        next();
      },

      verifyToken: (req, res, next) => {
        const token = req.body._csrf || req.headers['x-csrf-token'];
        const storedToken = tokens.get(req.session?.id || req.ip);

        if (!token || token !== storedToken) {
          return res.status(403).json({
            code: 403,
            message: 'CSRF token验证失败'
          });
        }

        next();
      }
    };
  }

  /**
   * 防止暴力破解
   */
  static bruteForceProtection() {
    const attempts = new Map();

    return (req, res, next) => {
      const identifier = req.user?.id || req.ip;
      const now = Date.now();
      const userAttempts = attempts.get(identifier) || { count: 0, lockUntil: null };

      // 检查是否被锁定
      if (userAttempts.lockUntil && now < userAttempts.lockUntil) {
        const remainingTime = Math.ceil((userAttempts.lockUntil - now) / 1000 / 60);
        return res.status(429).json({
          code: 429,
          message: `账户已被锁定，请${remainingTime}分钟后再试`
        });
      }

      // 重置过期的锁定
      if (userAttempts.lockUntil && now >= userAttempts.lockUntil) {
        attempts.delete(identifier);
        userAttempts.count = 0;
        userAttempts.lockUntil = null;
      }

      // 记录到请求对象
      req.securityAttempts = {
        identifier,
        increment: () => {
          userAttempts.count += 1;
          if (userAttempts.count >= 5) {
            userAttempts.lockUntil = now + 30 * 60 * 1000; // 锁定30分钟
          }
          attempts.set(identifier, userAttempts);
        },
        reset: () => {
          attempts.delete(identifier);
        }
      };

      next();
    };
  }

  /**
   * 敏感操作验证
   */
  static sensitiveOperation(req, res, next) {
    // 要求重新验证密码或2FA
    if (!req.headers['x-sensitive-operation-token']) {
      return res.status(403).json({
        code: 403,
        message: '敏感操作需要额外验证'
      });
    }
    next();
  }
}

module.exports = SecurityMiddleware;


// ==================== src/utils/encryption.js ====================
const crypto = require('crypto');

/**
 * 加密工具类
 */
class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32));
  }

  /**
   * 加密数据
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData) {
    try {
      const { iv, encryptedData: data, authTag } = encryptedData;
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      throw new Error('数据解密失败');
    }
  }

  /**
   * 生成安全的随机Token
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成安全的随机密码
   */
  static generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Hash数据（单向）
   */
  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * HMAC签名
   */
  static sign(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * 验证HMAC签名
   */
  static verify(data, signature, secret) {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new Encryption();


// ==================== src/models/AuditLog.js ====================
module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作类型'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作用户ID'
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '目标资源类型'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标资源ID'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理'
    },
    requestData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '请求数据'
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '响应状态码'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '执行时长(ms)'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '额外元数据'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] },
      { fields: ['ipAddress'] }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AuditLog;
};


// ==================== src/middleware/auditLog.js ====================
const { AuditLog } = require('../models');

/**
 * 审计日志中间件
 */
class AuditLogMiddleware {
  /**
   * 记录审计日志
   */
  static log(action, options = {}) {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // 保存原始方法
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      
      // 重写响应方法以捕获响应
      let responseBody = null;
      let statusCode = null;

      res.json = function(body) {
        responseBody = body;
        statusCode = res.statusCode;
        return originalJson(body);
      };

      res.send = function(body) {
        responseBody = body;
        statusCode = res.statusCode;
        return originalSend(body);
      };

      // 响应结束时记录日志
      res.on('finish', async () => {
        try {
          const duration = Date.now() - startTime;
          
          const logData = {
            action,
            userId: req.user?.id || null,
            targetType: options.targetType || null,
            targetId: req.params.id || null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            requestData: {
              method: req.method,
              url: req.originalUrl,
              params: req.params,
              query: req.query,
              body: this.sanitizeBody(req.body)
            },
            responseStatus: statusCode,
            errorMessage: statusCode >= 400 ? responseBody?.message : null,
            duration,
            metadata: options.metadata || {}
          };

          await AuditLog.create(logData);
        } catch (error) {
          console.error('审计日志记录失败:', error);
        }
      });

      next();
    };
  }

  /**
   * 清理敏感数据
   */
  static sanitizeBody(body) {
    if (!body) return null;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  /**
   * 查询审计日志
   */
  static async query(options = {}) {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = options;

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    return await AuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });
  }

  /**
   * 导出审计日志
   */
  static async export(options = {}) {
    const logs = await this.query({ ...options, limit: 10000 });
    
    // 转换为CSV格式
    const csv = this.convertToCSV(logs.rows);
    return csv;
  }

  /**
   * 转换为CSV
   */
  static convertToCSV(logs) {
    const headers = ['时间', '操作', '用户', 'IP地址', '状态', '耗时'];
    const rows = logs.map(log => [
      log.createdAt,
      log.action,
      log.user?.username || 'N/A',
      log.ipAddress,
      log.responseStatus,
      `${log.duration}ms`
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

module.exports = AuditLogMiddleware;


// ==================== src/utils/inputSanitizer.js ====================
const validator = require('validator');
const xss = require('xss');

/**
 * 输入清理和验证
 */
class InputSanitizer {
  /**
   * 清理字符串
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return input;
    
    // 移除HTML标签
    let sanitized = xss(input);
    
    // 移除多余空格
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    return sanitized;
  }

  /**
   * 清理对象中的所有字符串
   */
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * 验证并清理邮箱
   */
  static sanitizeEmail(email) {
    if (!email) return null;
    
    const sanitized = validator.normalizeEmail(email);
    return validator.isEmail(sanitized) ? sanitized : null;
  }

  /**
   * 验证并清理URL
   */
  static sanitizeURL(url) {
    if (!url) return null;
    
    try {
      const sanitized = validator.trim(url);
      return validator.isURL(sanitized, {
        protocols: ['http', 'https'],
        require_protocol: true
      }) ? sanitized : null;
    } catch {
      return null;
    }
  }

  /**
   * 清理HTML内容
   */
  static sanitizeHTML(html, options = {}) {
    const defaultOptions = {
      whiteList: {
        a: ['href', 'title', 'target'],
        b: [],
        strong: [],
        em: [],
        i: [],
        p: [],
        br: [],
        ul: [],
        ol: [],
        li: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
        blockquote: [],
        code: [],
        pre: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    };

    return xss(html, { ...defaultOptions, ...options });
  }

  /**
   * 防止SQL注入
   */
  static escapeSql(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * 验证文件名
   */
  static sanitizeFilename(filename) {
    if (!filename) return null;
    
    // 只允许字母、数字、下划线、连字符和点
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
  }

  /**
   * 验证文件类型
   */
  static validateFileType(mimetype, allowedTypes = []) {
    return allowedTypes.length === 0 || allowedTypes.includes(mimetype);
  }
}

module.exports = InputSanitizer;