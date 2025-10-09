
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