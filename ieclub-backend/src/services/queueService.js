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