// ==================== src/middleware/cache.js ====================
const redis = require('../utils/redis');
const logger = require('../utils/logger');

/**
 * 缓存中间件（商业级）
 */
class CacheMiddleware {
  /**
   * 缓存响应
   */
  static cache(options = {}) {
    const {
      ttl = 300,                    // 默认5分钟
      keyGenerator = null,          // 自定义键生成函数
      condition = null,             // 缓存条件函数
      skipOnError = true            // 出错时跳过缓存
    } = options;

    return async (req, res, next) => {
      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }

      // 检查条件
      if (condition && !condition(req)) {
        return next();
      }

      try {
        // 生成缓存键
        const cacheKey = keyGenerator
          ? keyGenerator(req)
          : `cache:${req.originalUrl}`;

        // 尝试从缓存获取
        const cached = await redis.get(cacheKey);

        if (cached) {
          logger.debug(`缓存命中: ${cacheKey}`);
          
          // 添加缓存头
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          
          return res.json(cached);
        }

        logger.debug(`缓存未命中: ${cacheKey}`);
        res.set('X-Cache', 'MISS');

        // 保存原始json方法
        const originalJson = res.json.bind(res);

        // 重写json方法以缓存响应
        res.json = function (data) {
          // 只缓存成功响应
          if (res.statusCode >= 200 && res.statusCode < 300) {
            redis.set(cacheKey, data, ttl).catch(err => {
              logger.error('缓存设置失败:', err);
            });
          }
          return originalJson(data);
        };

        next();
      } catch (error) {
        logger.error('缓存中间件错误:', error);
        if (skipOnError) {
          next();
        } else {
          next(error);
        }
      }
    };
  }

  /**
   * 缓存失效
   */
  static invalidate(patterns) {
    return async (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = async function (data) {
        // 成功响应后清除相关缓存
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            const key = typeof pattern === 'function'
              ? pattern(req)
              : pattern;

            await redis.delPattern(key).catch(err => {
              logger.error('缓存清除失败:', err);
            });
          }
        }
        return originalJson(data);
      };

      next();
    };
  }

  /**
   * 用户级缓存
   */
  static userCache(ttl = 300) {
    return this.cache({
      ttl,
      keyGenerator: (req) => {
        const userId = req.user?.id || 'anonymous';
        return `cache:user:${userId}:${req.originalUrl}`;
      },
      condition: (req) => req.user !== undefined
    });
  }

  /**
   * 分页缓存
   */
  static pageCache(ttl = 300) {
    return this.cache({
      ttl,
      keyGenerator: (req) => {
        const { page = 1, limit = 20, sort, filter } = req.query;
        const filterKey = filter ? `:${JSON.stringify(filter)}` : '';
        return `cache:page:${req.path}:${page}:${limit}:${sort}${filterKey}`;
      }
    });
  }

  /**
   * 列表缓存
   */
  static listCache(resourceType, ttl = 180) {
    return this.cache({
      ttl,
      keyGenerator: (req) => {
        const queryString = new URLSearchParams(req.query).toString();
        return `cache:list:${resourceType}:${queryString}`;
      }
    });
  }

  /**
   * 详情缓存
   */
  static detailCache(resourceType, ttl = 600) {
    return this.cache({
      ttl,
      keyGenerator: (req) => {
        const id = req.params.id;
        return `cache:detail:${resourceType}:${id}`;
      }
    });
  }

  /**
   * 条件缓存
   */
  static conditionalCache(condition, ttl = 300) {
    return this.cache({
      ttl,
      condition
    });
  }
}

module.exports = CacheMiddleware;