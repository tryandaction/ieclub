

// ==================== src/utils/queue.js ====================
const { Op } = require('sequelize');
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

  // 如果用户在线，推送实时通知（暂时注释，待实现WebSocket后启用）
  // const socketService = require('../services/socketService');
  // if (socketService.isUserOnline(userId)) {
  //   socketService.sendToUser(userId, 'notification', {
  //     type,
  //     title,
  //     content,
  //     data
  //   });
  // }

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