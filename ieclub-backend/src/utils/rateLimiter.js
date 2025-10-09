

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
