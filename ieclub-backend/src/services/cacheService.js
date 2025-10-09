// ==================== src/services/cacheService.js ====================
const redis = require('../utils/redis');
const logger = require('../utils/logger');

/**
 * 缓存服务（商业级）
 */
class CacheService {
  /**
   * 缓存用户信息
   */
  static async cacheUser(userId, userData, ttl = 3600) {
    try {
      const key = `user:${userId}`;
      await redis.set(key, userData, ttl);
      logger.debug(`用户信息已缓存: ${userId}`);
      return true;
    } catch (error) {
      logger.error('缓存用户信息失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存的用户信息
   */
  static async getCachedUser(userId) {
    try {
      const key = `user:${userId}`;
      return await redis.get(key);
    } catch (error) {
      logger.error('获取缓存用户信息失败:', error);
      return null;
    }
  }

  /**
   * 清除用户缓存
   */
  static async clearUserCache(userId) {
    try {
      await redis.del(`user:${userId}`);
      await redis.delPattern(`cache:user:${userId}:*`);
      logger.debug(`用户缓存已清除: ${userId}`);
      return true;
    } catch (error) {
      logger.error('清除用户缓存失败:', error);
      return false;
    }
  }

  /**
   * 缓存帖子信息
   */
  static async cachePost(postId, postData, ttl = 600) {
    try {
      const key = `post:${postId}`;
      await redis.set(key, postData, ttl);
      
      // 同时缓存到热门帖子集合
      if (postData.viewCount > 1000) {
        await redis.zadd('hot:posts', postData.viewCount, postId);
      }
      
      logger.debug(`帖子已缓存: ${postId}`);
      return true;
    } catch (error) {
      logger.error('缓存帖子失败:', error);
      return false;
    }
  }

  /**
   * 获取热门帖子
   */
  static async getHotPosts(limit = 10) {
    try {
      const postIds = await redis.zrevrange('hot:posts', 0, limit - 1);
      const posts = [];
      
      for (const postId of postIds) {
        const post = await redis.get(`post:${postId}`);
        if (post) posts.push(post);
      }
      
      return posts;
    } catch (error) {
      logger.error('获取热门帖子失败:', error);
      return [];
    }
  }

  /**
   * 增加浏览计数（使用Redis计数器）
   */
  static async incrementViewCount(resourceType, resourceId) {
    try {
      const key = `views:${resourceType}:${resourceId}`;
      const count = await redis.incr(key);
      
      // 设置过期时间（7天）
      if (count === 1) {
        await redis.expire(key, 604800);
      }
      
      return count;
    } catch (error) {
      logger.error('增加浏览计数失败:', error);
      return 0;
    }
  }

  /**
   * 获取浏览计数
   */
  static async getViewCount(resourceType, resourceId) {
    try {
      const key = `views:${resourceType}:${resourceId}`;
      const count = await redis.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('获取浏览计数失败:', error);
      return 0;
    }
  }

  /**
   * 缓存搜索结果
   */
  static async cacheSearchResults(query, results, ttl = 300) {
    try {
      const key = `search:${query}`;
      await redis.set(key, results, ttl);
      logger.debug(`搜索结果已缓存: ${query}`);
      return true;
    } catch (error) {
      logger.error('缓存搜索结果失败:', error);
      return false;
    }
  }

  /**
   * 会话管理
   */
  static async setSession(sessionId, sessionData, ttl = 86400) {
    try {
      const key = `session:${sessionId}`;
      await redis.set(key, sessionData, ttl);
      return true;
    } catch (error) {
      logger.error('设置会话失败:', error);
      return false;
    }
  }

  /**
   * 获取会话
   */
  static async getSession(sessionId) {
    try {
      const key = `session:${sessionId}`;
      return await redis.get(key);
    } catch (error) {
      logger.error('获取会话失败:', error);
      return null;
    }
  }

  /**
   * 删除会话
   */
  static async deleteSession(sessionId) {
    try {
      const key = `session:${sessionId}`;
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('删除会话失败:', error);
      return false;
    }
  }

  /**
   * 清除所有缓存
   */
  static async clearAll() {
    try {
      await redis.delPattern('cache:*');
      logger.info('所有缓存已清除');
      return true;
    } catch (error) {
      logger.error('清除所有缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats() {
    try {
      const info = await redis.info();
      const lines = info.split('\r\n');
      const stats = {};

      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      }

      return {
        connected: redis.isConnected,
        usedMemory: stats.used_memory_human,
        connectedClients: stats.connected_clients,
        totalKeys: await this.getTotalKeys(),
        hitRate: await this.getHitRate()
      };
    } catch (error) {
      logger.error('获取缓存统计失败:', error);
      return null;
    }
  }

  /**
   * 获取总键数
   */
  static async getTotalKeys() {
    try {
      const keys = await redis.getClient().keys('*');
      return keys.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 计算缓存命中率
   */
  static async getHitRate() {
    try {
      const info = await redis.info();
      const hits = this.extractStat(info, 'keyspace_hits');
      const misses = this.extractStat(info, 'keyspace_misses');
      
      if (hits + misses === 0) return 0;
      
      return ((hits / (hits + misses)) * 100).toFixed(2);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 提取统计值
   */
  static extractStat(info, key) {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1]) : 0;
  }
}

module.exports = CacheService;