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


// ==================== src/utils/queue.js ====================
const Bull = require('bull');
const logger = require('./logger');

/**
 * 任务队列管理器（商业级）
 */
class QueueManager {
  constructor() {
    this.queues = new Map();
    this.redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0
      }
    };
  }

  /**
   * 创建队列
   */
  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const defaultOptions = {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100, // 保留最近100个完成的任务
        removeOnFail: 200      // 保留最近200个失败的任务
      },
      settings: {
        stalledInterval: 30000, // 检查停滞任务的间隔
        maxStalledCount: 3      // 最大停滞次数
      }
    };

    const queue = new Bull(name, {
      ...this.redisConfig,
      ...defaultOptions,
      ...options
    });

    // 事件监听
    this.setupQueueEvents(queue, name);

    this.queues.set(name, queue);
    logger.info(`✅ 队列创建成功: ${name}`);

    return queue;
  }

  /**
   * 设置队列事件
   */
  setupQueueEvents(queue, name) {
    // 任务完成
    queue.on('completed', (job, result) => {
      logger.info(`✅ 任务完成 [${name}#${job.id}]`, {
        data: job.data,
        result
      });
    });

    // 任务失败
    queue.on('failed', (job, err) => {
      logger.error(`❌ 任务失败 [${name}#${job.id}]`, {
        error: err.message,
        attempts: job.attemptsMade,
        data: job.data
      });
    });

    // 任务进行中
    queue.on('active', (job) => {
      logger.debug(`⏳ 任务开始 [${name}#${job.id}]`);
    });

    // 任务停滞
    queue.on('stalled', (job) => {
      logger.warn(`⚠️ 任务停滞 [${name}#${job.id}]`);
    });

    // 任务进度更新
    queue.on('progress', (job, progress) => {
      logger.debug(`📊 任务进度 [${name}#${job.id}]: ${progress}%`);
    });

    // 队列错误
    queue.on('error', (err) => {
      logger.error(`队列错误 [${name}]:`, err);
    });
  }

  /**
   * 添加任务
   */
  async addJob(queueName, data, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列不存在: ${queueName}`);
    }

    try {
      const job = await queue.add(data, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        ...options
      });

      logger.info(`📝 任务已添加 [${queueName}#${job.id}]`, {
        data,
        options
      });

      return job;
    } catch (error) {
      logger.error(`添加任务失败 [${queueName}]:`, error);
      throw error;
    }
  }

  /**
   * 批量添加任务
   */
  async addBulk(queueName, jobs) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列不存在: ${queueName}`);
    }

    try {
      const result = await queue.addBulk(jobs);
      logger.info(`📝 批量添加任务 [${queueName}]: ${jobs.length}个`);
      return result;
    } catch (error) {
      logger.error(`批量添加任务失败 [${queueName}]:`, error);
      throw error;
    }
  }

  /**
   * 获取任务
   */
  async getJob(queueName, jobId) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return await queue.getJob(jobId);
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * 获取所有队列状态
   */
  async getAllQueueStatus() {
    const statuses = {};
    for (const [name] of this.queues) {
      statuses[name] = await this.getQueueStatus(name);
    }
    return statuses;
  }

  /**
   * 暂停队列
   */
  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    await queue.pause();
    logger.info(`⏸️ 队列已暂停: ${queueName}`);
    return true;
  }

  /**
   * 恢复队列
   */
  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    await queue.resume();
    logger.info(`▶️ 队列已恢复: ${queueName}`);
    return true;
  }

  /**
   * 清空队列
   */
  async cleanQueue(queueName, grace = 0) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    logger.info(`🧹 队列已清理: ${queueName}`);
    return true;
  }

  /**
   * 重试失败任务
   */
  async retryFailed(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    const failed = await queue.getFailed();
    let count = 0;

    for (const job of failed) {
      await job.retry();
      count++;
    }

    logger.info(`🔄 重试失败任务 [${queueName}]: ${count}个`);
    return count;
  }

  /**
   * 获取队列
   */
  getQueue(name) {
    return this.queues.get(name);
  }

  /**
   * 关闭队列
   */
  async closeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    await queue.close();
    this.queues.delete(queueName);
    logger.info(`队列已关闭: ${queueName}`);
    return true;
  }

  /**
   * 关闭所有队列
   */
  async closeAll() {
    const closePromises = [];
    for (const [name, queue] of this.queues) {
      closePromises.push(
        queue.close().then(() => {
          logger.info(`队列已关闭: ${name}`);
        })
      );
    }

    await Promise.all(closePromises);
    this.queues.clear();
    logger.info('所有队列已关闭');
  }
}

// 创建单例
const queueManager = new QueueManager();

// ==================== 预定义队列 ====================

/**
 * 邮件队列
 */
const emailQueue = queueManager.createQueue('email', {
  limiter: {
    max: 100,      // 最大任务数
    duration: 60000 // 每分钟
  }
});

emailQueue.process(async (job) => {
  const { to, subject, html, attachments } = job.data;
  const emailService = require('../services/emailService');

  logger.info(`📧 发送邮件: ${to}`);
  await emailService.send(to, subject, html, attachments);

  return { sent: true, to, timestamp: new Date() };
});

/**
 * 图片处理队列
 */
const imageQueue = queueManager.createQueue('image', {
  limiter: {
    max: 50,
    duration: 60000
  }
});

imageQueue.process(async (job) => {
  const { imagePath, options } = job.data;
  const imageCompressor = require('./imageCompressor');

  logger.info(`🖼️ 处理图片: ${imagePath}`);
  
  // 更新进度
  job.progress(30);
  
  const result = await imageCompressor.compress(
    imagePath,
    imagePath,
    options
  );
  
  job.progress(100);

  return { 
    processed: true, 
    path: result,
    timestamp: new Date()
  };
});

/**
 * 通知队列
 */
const notificationQueue = queueManager.createQueue('notification', {
  limiter: {
    max: 200,
    duration: 60000
  }
});

notificationQueue.process(async (job) => {
  const { userId, type, data, title, content } = job.data;
  const { Notification } = require('../models');

  logger.info(`🔔 创建通知: ${userId} - ${type}`);

  await Notification.create({
    userId,
    type,
    title,
    content,
    data
  });

  // 如果用户在线，推送实时通知
  const socketService = require('../services/socketService');
  if (socketService.isUserOnline(userId)) {
    socketService.sendToUser(userId, 'notification', {
      type,
      title,
      content,
      data
    });
  }

  return { created: true, userId, type };
});

/**
 * OCR识别队列
 */
const ocrQueue = queueManager.createQueue('ocr', {
  limiter: {
    max: 30,
    duration: 60000
  }
});

ocrQueue.process(async (job) => {
  const { imagePath, userId, recordId } = job.data;
  const ocrService = require('../services/ocrService');
  const { OCRRecord } = require('../models');

  logger.info(`📝 OCR识别: ${imagePath}`);

  // 更新进度
  job.progress(10);

  // 执行OCR
  const result = await ocrService.recognizeText(imagePath);

  job.progress(80);

  // 更新记录
  if (recordId) {
    await OCRRecord.update(
      {
        result: result.text,
        confidence: result.confidence,
        status: 'completed'
      },
      { where: { id: recordId } }
    );
  }

  job.progress(100);

  return { 
    recognized: true, 
    text: result.text,
    confidence: result.confidence,
    timestamp: new Date()
  };
});

/**
 * 数据统计队列
 */
const statsQueue = queueManager.createQueue('stats', {
  limiter: {
    max: 10,
    duration: 60000
  }
});

statsQueue.process(async (job) => {
  const { type, period } = job.data;
  const { User, Post, Event } = require('../models');
  const redis = require('./redis');

  logger.info(`📊 生成统计数据: ${type} - ${period}`);

  let stats = {};

  switch (type) {
    case 'users':
      stats = {
        total: await User.count(),
        active: await User.count({ where: { status: 'active' } }),
        verified: await User.count({ where: { emailVerified: true } })
      };
      break;

    case 'posts':
      stats = {
        total: await Post.count(),
        published: await Post.count({ where: { status: 'published' } }),
        draft: await Post.count({ where: { status: 'draft' } })
      };
      break;

    case 'events':
      stats = {
        total: await Event.count(),
        upcoming: await Event.count({ 
          where: { 
            startTime: { [Op.gt]: new Date() } 
          } 
        }),
        past: await Event.count({ 
          where: { 
            endTime: { [Op.lt]: new Date() } 
          } 
        })
      };
      break;
  }

  // 缓存统计结果
  await redis.set(`stats:${type}:${period}`, stats, 3600);

  return stats;
});

module.exports = {
  queueManager,
  emailQueue,
  imageQueue,
  notificationQueue,
  ocrQueue,
  statsQueue
};


// ==================== src/services/queueService.js ====================
const {
  emailQueue,
  imageQueue,
  notificationQueue,
  ocrQueue,
  statsQueue
} = require('../utils/queue');
const logger = require('../utils/logger');

/**
 * 队列服务（商业级）
 */
class QueueService {
  /**
   * 发送邮件（异步）
   */
  static async sendEmail(to, subject, html, options = {}) {
    try {
      const job = await emailQueue.add(
        {
          to,
          subject,
          html,
          attachments: options.attachments
        },
        {
          priority: options.priority || 1,
          delay: options.delay || 0,
          attempts: options.attempts || 3
        }
      );

      logger.info(`邮件任务已加入队列: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加邮件任务失败:', error);
      throw error;
    }
  }

  /**
   * 批量发送邮件
   */
  static async sendBulkEmails(emails) {
    try {
      const jobs = emails.map(email => ({
        data: {
          to: email.to,
          subject: email.subject,
          html: email.html,
          attachments: email.attachments
        },
        opts: {
          priority: email.priority || 1
        }
      }));

      const result = await emailQueue.addBulk(jobs);
      logger.info(`批量邮件任务已加入队列: ${jobs.length}个`);
      return result;
    } catch (error) {
      logger.error('批量发送邮件失败:', error);
      throw error;
    }
  }

  /**
   * 处理图片（异步）
   */
  static async processImage(imagePath, options = {}) {
    try {
      const job = await imageQueue.add(
        {
          imagePath,
          options: {
            quality: options.quality || 80,
            maxWidth: options.maxWidth || 1920,
            maxHeight: options.maxHeight || 1080,
            ...options
          }
        },
        {
          priority: options.priority || 2,
          attempts: 2
        }
      );

      logger.info(`图片处理任务已加入队列: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加图片处理任务失败:', error);
      throw error;
    }
  }

  /**
   * 批量处理图片
   */
  static async processBulkImages(images) {
    try {
      const jobs = images.map(image => ({
        data: {
          imagePath: image.path,
          options: image.options || {}
        },
        opts: {
          priority: 2
        }
      }));

      const result = await imageQueue.addBulk(jobs);
      logger.info(`批量图片处理任务已加入队列: ${jobs.length}个`);
      return result;
    } catch (error) {
      logger.error('批量处理图片失败:', error);
      throw error;
    }
  }

  /**
   * 发送通知（异步）
   */
  static async sendNotification(userId, type, data) {
    try {
      const job = await notificationQueue.add(
        {
          userId,
          type,
          title: data.title,
          content: data.content,
          data: data.extra || {}
        },
        {
          priority: this.getNotificationPriority(type),
          attempts: 2
        }
      );

      logger.info(`通知任务已加入队列: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加通知任务失败:', error);
      throw error;
    }
  }

  /**
   * 批量发送通知
   */
  static async sendBulkNotifications(notifications) {
    try {
      const jobs = notifications.map(notif => ({
        data: {
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          content: notif.content,
          data: notif.data || {}
        },
        opts: {
          priority: this.getNotificationPriority(notif.type)
        }
      }));

      const result = await notificationQueue.addBulk(jobs);
      logger.info(`批量通知任务已加入队列: ${jobs.length}个`);
      return result;
    } catch (error) {
      logger.error('批量发送通知失败:', error);
      throw error;
    }
  }

  /**
   * OCR识别（异步）
   */
  static async recognizeText(imagePath, userId, recordId) {
    try {
      const job = await ocrQueue.add(
        {
          imagePath,
          userId,
          recordId
        },
        {
          priority: 3,
          attempts: 2,
          timeout: 60000 // 60秒超时
        }
      );

      logger.info(`OCR任务已加入队列: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加OCR任务失败:', error);
      throw error;
    }
  }

  /**
   * 生成统计数据（异步）
   */
  static async generateStats(type, period = 'daily') {
    try {
      const job = await statsQueue.add(
        {
          type,
          period
        },
        {
          priority: 1,
          attempts: 1
        }
      );

      logger.info(`统计任务已加入队列: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加统计任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  static async getJobStatus(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job._progress;

      return {
        id: job.id,
        status: state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp
      };
    } catch (error) {
      logger.error('获取任务状态失败:', error);
      throw error;
    }
  }

  /**
   * 取消任务
   */
  static async cancelJob(queueName, jobId) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      logger.info(`任务已取消: ${queueName}#${jobId}`);
      return true;
    } catch (error) {
      logger.error('取消任务失败:', error);
      throw error;
    }
  }

  /**
   * 获取队列引用
   */
  static getQueue(name) {
    const queues = {
      email: emailQueue,
      image: imageQueue,
      notification: notificationQueue,
      ocr: ocrQueue,
      stats: statsQueue
    };

    return queues[name];
  }

  /**
   * 获取通知优先级
   */
  static getNotificationPriority(type) {
    const priorities = {
      system: 5,    // 系统通知最高
      mention: 4,   // @提醒
      like: 2,      // 点赞
      comment: 3,   // 评论
      follow: 2,    // 关注
      event: 3      // 活动通知
    };

    return priorities[type] || 1;
  }
}

module.exports = QueueService;


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