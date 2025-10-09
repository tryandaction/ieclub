
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