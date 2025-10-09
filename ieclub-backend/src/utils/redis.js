// ==================== src/utils/redis.js ====================
const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Redis客户端管理器（商业级）
 */
class RedisManager {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * 初始化Redis连接
   */
  init() {
    try {
      const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            logger.error('Redis重连次数超限，停止重连');
            return null;
          }
          const delay = Math.min(times * 200, 3000);
          logger.info(`Redis重连中... 第${times}次，延迟${delay}ms`);
          return delay;
        },
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: true,
        connectTimeout: 10000,
        keepAlive: 30000
      };

      // 主客户端
      this.client = new Redis(config);

      // 发布订阅需要独立连接
      this.subscriber = new Redis(config);
      this.publisher = new Redis(config);

      // 连接事件监听
      this.setupEventHandlers(this.client, 'Main');
      this.setupEventHandlers(this.subscriber, 'Subscriber');
      this.setupEventHandlers(this.publisher, 'Publisher');

      // 连接所有客户端
      return Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]).then(() => {
        logger.info('✅ Redis所有连接初始化成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });
    } catch (error) {
      logger.error('Redis初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers(client, name) {
    client.on('connect', () => {
      logger.info(`✅ Redis[${name}] 连接成功`);
    });

    client.on('ready', () => {
      logger.info(`✅ Redis[${name}] 就绪`);
      this.isConnected = true;
    });

    client.on('error', (err) => {
      logger.error(`Redis[${name}] 错误:`, err);
      this.isConnected = false;
    });

    client.on('close', () => {
      logger.warn(`Redis[${name}] 连接关闭`);
      this.isConnected = false;
    });

    client.on('reconnecting', (delay) => {
      this.reconnectAttempts++;
      logger.info(`Redis[${name}] 正在重连... 延迟${delay}ms`);
    });

    client.on('end', () => {
      logger.warn(`Redis[${name}] 连接终止`);
      this.isConnected = false;
    });
  }

  /**
   * 获取主客户端
   */
  getClient() {
    if (!this.client) {
      throw new Error('Redis客户端未初始化');
    }
    return this.client;
  }

  /**
   * 获取发布者
   */
  getPublisher() {
    if (!this.publisher) {
      throw new Error('Redis发布者未初始化');
    }
    return this.publisher;
  }

  /**
   * 获取订阅者
   */
  getSubscriber() {
    if (!this.subscriber) {
      throw new Error('Redis订阅者未初始化');
    }
    return this.subscriber;
  }

  /**
   * 检查连接状态
   */
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis PING失败:', error);
      return false;
    }
  }

  /**
   * 设置键值（带过期时间）
   */
  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET失败:', error);
      return false;
    }
  }

  /**
   * 获取键值
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET失败:', error);
      return null;
    }
  }

  /**
   * 删除键
   */
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL失败:', error);
      return 0;
    }
  }

  /**
   * 批量删除（支持通配符）
   */
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      logger.error('Redis批量删除失败:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    try {
      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error('Redis EXISTS失败:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE失败:', error);
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL失败:', error);
      return -2;
    }
  }

  /**
   * 自增
   */
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR失败:', error);
      return null;
    }
  }

  /**
   * 自增指定值
   */
  async incrBy(key, increment) {
    try {
      return await this.client.incrby(key, increment);
    } catch (error) {
      logger.error('Redis INCRBY失败:', error);
      return null;
    }
  }

  /**
   * 自减
   */
  async decr(key) {
    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error('Redis DECR失败:', error);
      return null;
    }
  }

  /**
   * Hash操作：设置字段
   */
  async hset(key, field, value) {
    try {
      const serialized = JSON.stringify(value);
      return await this.client.hset(key, field, serialized);
    } catch (error) {
      logger.error('Redis HSET失败:', error);
      return false;
    }
  }

  /**
   * Hash操作：获取字段
   */
  async hget(key, field) {
    try {
      const data = await this.client.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis HGET失败:', error);
      return null;
    }
  }

  /**
   * Hash操作：获取所有字段
   */
  async hgetall(key) {
    try {
      const data = await this.client.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      logger.error('Redis HGETALL失败:', error);
      return {};
    }
  }

  /**
   * Hash操作：删除字段
   */
  async hdel(key, ...fields) {
    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      logger.error('Redis HDEL失败:', error);
      return 0;
    }
  }

  /**
   * List操作：左推入
   */
  async lpush(key, ...values) {
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      logger.error('Redis LPUSH失败:', error);
      return 0;
    }
  }

  /**
   * List操作：右推入
   */
  async rpush(key, ...values) {
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.rpush(key, ...serialized);
    } catch (error) {
      logger.error('Redis RPUSH失败:', error);
      return 0;
    }
  }

  /**
   * List操作：左弹出
   */
  async lpop(key) {
    try {
      const data = await this.client.lpop(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis LPOP失败:', error);
      return null;
    }
  }

  /**
   * List操作：右弹出
   */
  async rpop(key) {
    try {
      const data = await this.client.rpop(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis RPOP失败:', error);
      return null;
    }
  }

  /**
   * List操作：获取范围
   */
  async lrange(key, start, stop) {
    try {
      const data = await this.client.lrange(key, start, stop);
      return data.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      logger.error('Redis LRANGE失败:', error);
      return [];
    }
  }

  /**
   * Set操作：添加成员
   */
  async sadd(key, ...members) {
    try {
      const serialized = members.map(m => JSON.stringify(m));
      return await this.client.sadd(key, ...serialized);
    } catch (error) {
      logger.error('Redis SADD失败:', error);
      return 0;
    }
  }

  /**
   * Set操作：获取所有成员
   */
  async smembers(key) {
    try {
      const data = await this.client.smembers(key);
      return data.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      logger.error('Redis SMEMBERS失败:', error);
      return [];
    }
  }

  /**
   * Set操作：检查成员是否存在
   */
  async sismember(key, member) {
    try {
      const serialized = JSON.stringify(member);
      return await this.client.sismember(key, serialized) === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER失败:', error);
      return false;
    }
  }

  /**
   * Set操作：移除成员
   */
  async srem(key, ...members) {
    try {
      const serialized = members.map(m => JSON.stringify(m));
      return await this.client.srem(key, ...serialized);
    } catch (error) {
      logger.error('Redis SREM失败:', error);
      return 0;
    }
  }

  /**
   * Sorted Set操作：添加成员
   */
  async zadd(key, score, member) {
    try {
      const serialized = JSON.stringify(member);
      return await this.client.zadd(key, score, serialized);
    } catch (error) {
      logger.error('Redis ZADD失败:', error);
      return 0;
    }
  }

  /**
   * Sorted Set操作：获取范围（按分数）
   */
  async zrange(key, start, stop, withScores = false) {
    try {
      const args = [key, start, stop];
      if (withScores) args.push('WITHSCORES');
      
      const data = await this.client.zrange(...args);
      return data.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      logger.error('Redis ZRANGE失败:', error);
      return [];
    }
  }

  /**
   * Sorted Set操作：获取倒序范围
   */
  async zrevrange(key, start, stop, withScores = false) {
    try {
      const args = [key, start, stop];
      if (withScores) args.push('WITHSCORES');
      
      const data = await this.client.zrevrange(...args);
      return data.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      logger.error('Redis ZREVRANGE失败:', error);
      return [];
    }
  }

  /**
   * 发布消息
   */
  async publish(channel, message) {
    try {
      const serialized = JSON.stringify(message);
      return await this.publisher.publish(channel, serialized);
    } catch (error) {
      logger.error('Redis PUBLISH失败:', error);
      return 0;
    }
  }

  /**
   * 订阅频道
   */
  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch {
            callback(message);
          }
        }
      });
      logger.info(`订阅频道: ${channel}`);
    } catch (error) {
      logger.error('Redis SUBSCRIBE失败:', error);
    }
  }

  /**
   * 取消订阅
   */
  async unsubscribe(channel) {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info(`取消订阅: ${channel}`);
    } catch (error) {
      logger.error('Redis UNSUBSCRIBE失败:', error);
    }
  }

  /**
   * 获取数据库信息
   */
  async info() {
    try {
      return await this.client.info();
    } catch (error) {
      logger.error('Redis INFO失败:', error);
      return '';
    }
  }

  /**
   * 清空当前数据库
   */
  async flushdb() {
    try {
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Redis FLUSHDB失败:', error);
      return false;
    }
  }

  /**
   * 关闭所有连接
   */
  async close() {
    try {
      await Promise.all([
        this.client?.quit(),
        this.subscriber?.quit(),
        this.publisher?.quit()
      ]);
      this.isConnected = false;
      logger.info('Redis所有连接已关闭');
    } catch (error) {
      logger.error('Redis关闭失败:', error);
    }
  }
}

// 创建单例
const redis = new RedisManager();

module.exports = redis;