// ==================== src/middleware/security.js ====================
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * 企业级安全中间件配置
 */
class SecurityMiddleware {
  /**
   * Helmet - HTTP头安全
   */
  static helmet() {
    return helmet({
      // 内容安全策略
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.ieclub.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      // 跨域资源嵌入策略
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // DNS预取控制
      dnsPrefetchControl: { allow: false },
      // 下载选项
      ieNoOpen: true,
      // Frame选项
      frameguard: { action: "deny" },
      // 隐藏X-Powered-By
      hidePoweredBy: true,
      // HSTS
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      // MIME类型嗅探
      noSniff: true,
      // Referrer策略
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // XSS过滤
      xssFilter: true
    });
  }

  /**
   * CORS配置
   */
  static cors() {
    const whitelist = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://ieclub.com',
      'https://www.ieclub.com',
      'https://admin.ieclub.com'
    ];

    return cors({
      origin: (origin, callback) => {
        // 允许无origin的请求（如移动应用、Postman）
        if (!origin) return callback(null, true);
        
        if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('不允许的CORS来源'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400 // 24小时
    });
  }

  /**
   * NoSQL注入防护
   */
  static sanitize() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn('检测到NoSQL注入尝试', {
          ip: req.ip,
          url: req.originalUrl,
          key
        });
      }
    });
  }

  /**
   * XSS防护
   */
  static xssClean() {
    return xss();
  }

  /**
   * HTTP参数污染防护
   */
  static hpp() {
    return hpp({
      whitelist: [
        'sort',
        'fields',
        'page',
        'limit',
        'filter',
        'tags',
        'category'
      ]
    });
  }

  /**
   * API速率限制
   */
  static rateLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15分钟
      max = 100,                   // 最多100个请求
      message = '请求过于频繁，请稍后再试',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    return rateLimit({
      windowMs,
      max,
      message: { success: false, error: message },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // 跳过健康检查
        return req.path === '/health';
      },
      handler: (req, res) => {
        logger.warn('速率限制触发', {
          ip: req.ip,
          url: req.originalUrl,
          userAgent: req.get('user-agent')
        });
        
        res.status(429).json({
          success: false,
          error: message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      },
      skipSuccessfulRequests,
      skipFailedRequests
    });
  }

  /**
   * 登录速率限制（更严格）
   */
  static loginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { 
        success: false, 
        error: '登录尝试次数过多，请15分钟后再试' 
      },
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        // 使用IP + 邮箱作为键
        return `${req.ip}:${req.body.email || 'unknown'}`;
      }
    });
  }

  /**
   * 注册速率限制
   */
  static registerLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1小时
      max: 3,
      message: {
        success: false,
        error: '注册次数过多，请1小时后再试'
      }
    });
  }

  /**
   * API签名验证（防重放攻击）
   */
  static signatureVerification() {
    return (req, res, next) => {
      // 仅对POST/PUT/DELETE请求验证
      if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
      }

      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];
      const nonce = req.headers['x-nonce'];

      // 如果是内部API调用，跳过验证
      if (req.headers['x-internal-api'] === process.env.INTERNAL_API_SECRET) {
        return next();
      }

      // 生产环境必须验证签名
      if (process.env.NODE_ENV === 'production') {
        if (!signature || !timestamp || !nonce) {
          return res.status(401).json({
            success: false,
            error: '缺少签名信息'
          });
        }

        // 检查时间戳（5分钟内有效）
        const now = Date.now();
        const requestTime = parseInt(timestamp);
        if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
          return res.status(401).json({
            success: false,
            error: '请求已过期'
          });
        }

        // 验证签名
        const body = JSON.stringify(req.body);
        const data = `${timestamp}${nonce}${body}`;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.API_SECRET)
          .update(data)
          .digest('hex');

        if (signature !== expectedSignature) {
          logger.warn('签名验证失败', {
            ip: req.ip,
            url: req.originalUrl
          });
          
          return res.status(401).json({
            success: false,
            error: '签名验证失败'
          });
        }
      }

      next();
    };
  }

  /**
   * SQL注入防护（二次检查）
   */
  static sqlInjectionProtection() {
    const sqlPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(--|\#|\/\*)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i
    ];

    return (req, res, next) => {
      const checkValue = (value) => {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      const checkObject = (obj) => {
        for (const key in obj) {
          if (checkValue(obj[key])) {
            return true;
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkObject(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };

      // 检查查询参数、请求体、路径参数
      if (checkObject(req.query) || checkObject(req.body) || checkObject(req.params)) {
        logger.warn('检测到SQL注入尝试', {
          ip: req.ip,
          url: req.originalUrl,
          query: req.query,
          body: req.body
        });

        return res.status(400).json({
          success: false,
          error: '检测到非法请求'
        });
      }

      next();
    };
  }

  /**
   * 敏感数据脱敏
   */
  static sanitizeResponse() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        if (data && typeof data === 'object') {
          // 递归脱敏
          const sanitize = (obj) => {
            if (Array.isArray(obj)) {
              return obj.map(sanitize);
            }
            
            if (obj && typeof obj === 'object') {
              const sanitized = { ...obj };
              
              // 移除敏感字段
              const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
              sensitiveFields.forEach(field => {
                if (sanitized[field] !== undefined) {
                  delete sanitized[field];
                }
              });

              // 脱敏邮箱
              if (sanitized.email && typeof sanitized.email === 'string') {
                // 只对非当前用户的邮箱脱敏
                if (!req.user || sanitized.id !== req.user.id) {
                  const [name, domain] = sanitized.email.split('@');
                  sanitized.email = `${name.substring(0, 2)}***@${domain}`;
                }
              }

              // 脱敏手机号
              if (sanitized.phone && typeof sanitized.phone === 'string') {
                if (!req.user || sanitized.id !== req.user.id) {
                  sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
                }
              }

              // 递归处理嵌套对象
              Object.keys(sanitized).forEach(key => {
                if (sanitized[key] && typeof sanitized[key] === 'object') {
                  sanitized[key] = sanitize(sanitized[key]);
                }
              });

              return sanitized;
            }
            
            return obj;
          };

          data = sanitize(data);
        }

        return originalJson(data);
      };

      next();
    };
  }

  /**
   * 防止点击劫持
   */
  static preventClickjacking() {
    return (req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    };
  }

  /**
   * 请求体大小限制
   */
  static bodySizeLimit() {
    return (req, res, next) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
          success: false,
          error: '请求体过大'
        });
      }

      next();
    };
  }

  /**
   * IP白名单（管理员接口）
   */
  static ipWhitelist(whitelist = []) {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      
      // 开发环境跳过
      if (process.env.NODE_ENV === 'development') {
        return next();
      }

      if (!whitelist.includes(ip)) {
        logger.warn('IP不在白名单中', { ip, url: req.originalUrl });
        
        return res.status(403).json({
          success: false,
          error: '访问被拒绝'
        });
      }

      next();
    };
  }

  /**
   * 检测爬虫和机器人
   */
  static botDetection() {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    return (req, res, next) => {
      const userAgent = req.get('user-agent') || '';
      
      for (const pattern of botPatterns) {
        if (pattern.test(userAgent)) {
          // 记录但不阻止（可根据需要调整）
          logger.info('检测到爬虫访问', {
            ip: req.ip,
            userAgent,
            url: req.originalUrl
          });
          break;
        }
      }

      next();
    };
  }

  /**
   * CSRF保护
   */
  static csrfProtection() {
    const csrf = require('csurf');
    return csrf({ 
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    });
  }

  /**
   * 组合所有安全中间件
   */
  static applyAll(app) {
    // 基础安全
    app.use(this.helmet());
    app.use(this.cors());
    app.use(this.sanitize());
    app.use(this.xssClean());
    app.use(this.hpp());
    app.use(this.sqlInjectionProtection());
    app.use(this.preventClickjacking());
    app.use(this.bodySizeLimit());
    app.use(this.botDetection());
    app.use(this.sanitizeResponse());

    // 全局速率限制
    app.use('/api/', this.rateLimiter());

    logger.info('✅ 安全中间件已启用');
  }
}

module.exports = SecurityMiddleware;


// ==================== src/utils/encryption.js ====================
const crypto = require('crypto');

/**
 * 数据加密工具类
 */
class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltLength = 64;
    this.tagLength = 16;
    this.iterations = 100000;
    
    // 从环境变量获取主密钥
    this.masterKey = process.env.ENCRYPTION_KEY || this.generateKey();
  }

  /**
   * 生成随机密钥
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * 生成随机IV
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * 生成随机盐
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * 派生密钥
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha512'
    );
  }

  /**
   * AES-256-GCM加密
   */
  encrypt(text) {
    try {
      const iv = this.generateIV();
      const salt = this.generateSalt();
      const key = this.deriveKey(this.masterKey, salt);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // 返回格式: salt:iv:tag:encrypted
      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])
        .toString('base64');
    } catch (error) {
      throw new Error('加密失败: ' + error.message);
    }
  }

  /**
   * AES-256-GCM解密
   */
  decrypt(encryptedData) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.slice(0, this.saltLength);
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = buffer.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = buffer.slice(this.saltLength + this.ivLength + this.tagLength);
      
      const key = this.deriveKey(this.masterKey, salt);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('解密失败: ' + error.message);
    }
  }

  /**
   * 哈希密码
   */
  async hashPassword(password) {
    const salt = this.generateSalt();
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      64,
      'sha512'
    );
    
    return Buffer.concat([salt, hash]).toString('base64');
  }

  /**
   * 验证密码
   */
  async verifyPassword(password, hashedPassword) {
    try {
      const buffer = Buffer.from(hashedPassword, 'base64');
      const salt = buffer.slice(0, this.saltLength);
      const originalHash = buffer.slice(this.saltLength);
      
      const hash = crypto.pbkdf2Sync(
        password,
        salt,
        this.iterations,
        64,
        'sha512'
      );
      
      return crypto.timingSafeEqual(hash, originalHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成安全token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * HMAC签名
   */
  sign(data, secret = this.masterKey) {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * 验证HMAC签名
   */
  verifySignature(data, signature, secret = this.masterKey) {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 加密敏感字段
   */
  encryptObject(obj, fields = []) {
    const encrypted = { ...obj };
    
    fields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field].toString());
      }
    });
    
    return encrypted;
  }

  /**
   * 解密敏感字段
   */
  decryptObject(obj, fields = []) {
    const decrypted = { ...obj };
    
    fields.forEach(field => {
      if (decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          // 解密失败，保持原值
        }
      }
    });
    
    return decrypted;
  }

  /**
   * 生成API密钥对
   */
  generateApiKeyPair() {
    const apiKey = this.generateToken(32);
    const apiSecret = this.generateToken(64);
    const hashedSecret = this.sign(apiSecret);
    
    return {
      apiKey,
      apiSecret,
      hashedSecret
    };
  }
}

module.exports = new Encryption();


// ==================== src/utils/inputSanitizer.js ====================
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

/**
 * 输入清理工具
 */
class InputSanitizer {
  /**
   * 清理HTML（防XSS）
   */
  static sanitizeHtml(html) {
    if (!html) return '';
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
    });
  }

  /**
   * 清理字符串（移除特殊字符）
   */
  static sanitizeString(str) {
    if (!str) return '';
    
    return validator.escape(
      str.toString()
        .trim()
        .replace(/[<>]/g, '')
    );
  }

  /**
   * 验证并清理邮箱
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    
    const normalized = validator.normalizeEmail(email);
    return validator.isEmail(normalized) ? normalized : '';
  }

  /**
   * 验证并清理URL
   */
  static sanitizeUrl(url) {
    if (!url) return '';
    
    const trimmed = url.trim();
    if (validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      return trimmed;
    }
    
    return '';
  }

  /**
   * 清理文件名
   */
  static sanitizeFilename(filename) {
    if (!filename) return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }

  /**
   * 清理路径（防止路径遍历）
   */
  static sanitizePath(path) {
    if (!path) return '';
    
    return path
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/\/+/g, '/');
  }

  /**
   * 清理用户输入对象
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'object') {
      return input;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * 验证和清理Markdown
   */
  static sanitizeMarkdown(markdown) {
    if (!markdown) return '';
    
    // 移除危险的Markdown语法
    return markdown
      .replace(/!\[.*?\]\(javascript:.*?\)/gi, '')
      .replace(/<script.*?>.*?<\/script>/gis, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * 批量清理
   */
  static sanitizeBatch(data, rules) {
    const sanitized = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      if (data[field] === undefined) continue;
      
      switch (rule) {
        case 'string':
          sanitized[field] = this.sanitizeString(data[field]);
          break;
        case 'email':
          sanitized[field] = this.sanitizeEmail(data[field]);
          break;
        case 'url':
          sanitized[field] = this.sanitizeUrl(data[field]);
          break;
        case 'html':
          sanitized[field] = this.sanitizeHtml(data[field]);
          break;
        case 'markdown':
          sanitized[field] = this.sanitizeMarkdown(data[field]);
          break;
        default:
          sanitized[field] = data[field];
      }
    }
    
    return sanitized;
  }
}

module.exports = InputSanitizer;