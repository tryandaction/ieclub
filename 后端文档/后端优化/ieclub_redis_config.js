
// ==================== 使用示例 ====================

// ========== 1. 在控制器中使用缓存 ==========
// src/controllers/postController.js

const CacheMiddleware = require('../middleware/cache');
const CacheService = require('../services/cacheService');
const QueueService = require('../services/queueService');
const { Post, User } = require('../models');

class PostController {
  /**
   * 获取帖子列表（带缓存）
   */
  static async getPosts(req, res) {
    try {
      const { page = 1, limit = 20, sort = 'createdAt' } = req.query;
      
      const posts = await Post.findAndCountAll({
        where: { status: 'published' },
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [[sort, 'DESC']],
        include: [{ model: User, as: 'author' }]
      });

      res.json({
        success: true,
        data: posts.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: posts.count
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取帖子详情（带缓存和浏览计数）
   */
  static async getPost(req, res) {
    try {
      const { id } = req.params;

      // 先从缓存获取
      let post = await CacheService.getCachedPost(id);

      if (!post) {
        // 缓存未命中，从数据库查询
        post = await Post.findByPk(id, {
          include: [{ model: User, as: 'author' }]
        });

        if (!post) {
          return res.status(404).json({
            success: false,
            error: '帖子不存在'
          });
        }

        // 缓存帖子
        await CacheService.cachePost(id, post.toJSON());
      }

      // 异步增加浏览次数
      CacheService.incrementViewCount('post', id)
        .then(count => {
          // 每100次浏览更新数据库
          if (count % 100 === 0) {
            Post.update(
              { viewCount: count },
              { where: { id } }
            );
          }
        });

      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 创建帖子（触发缓存失效和任务队列）
   */
  static async createPost(req, res) {
    try {
      const { title, content, images } = req.body;
      const userId = req.user.id;

      // 创建帖子
      const post = await Post.create({
        title,
        content,
        authorId: userId,
        status: 'published'
      });

      // 异步处理图片
      if (images && images.length > 0) {
        for (const image of images) {
          await QueueService.processImage(image, {
            quality: 80,
            maxWidth: 1920
          });
        }
      }

      // 清除列表缓存
      await CacheService.clearPostListCache();

      // 发送通知给关注者
      const followers = await req.user.getFollowers();
      const notifications = followers.map(follower => ({
        userId: follower.id,
        type: 'new_post',
        title: '新帖子发布',
        content: `${req.user.nickname}发布了新帖子: ${title}`
      }));

      await QueueService.sendBulkNotifications(notifications);

      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = PostController;


// ========== 2. 路由中应用缓存中间件 ==========
// src/routes/post.js

const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController');
const CacheMiddleware = require('../middleware/cache');
const auth = require('../middleware/auth');

// 获取帖子列表 - 使用分页缓存（3分钟）
router.get('/',
  CacheMiddleware.pageCache(180),
  PostController.getPosts
);

// 获取帖子详情 - 使用详情缓存（10分钟）
router.get('/:id',
  CacheMiddleware.detailCache('post', 600),
  PostController.getPost
);

// 创建帖子 - 需要认证，触发缓存失效
router.post('/',
  auth.required,
  CacheMiddleware.invalidate(['cache:page:posts:*', 'cache:list:posts:*']),
  PostController.createPost
);

// 更新帖子 - 清除特定缓存
router.put('/:id',
  auth.required,
  CacheMiddleware.invalidate([
    (req) => `cache:detail:post:${req.params.id}`,
    'cache:page:posts:*'
  ]),
  PostController.updatePost
);

// 删除帖子 - 清除所有相关缓存
router.delete('/:id',
  auth.required,
  CacheMiddleware.invalidate([
    (req) => `cache:detail:post:${req.params.id}`,
    'cache:page:posts:*',
    'cache:list:posts:*'
  ]),
  PostController.deletePost
);

module.exports = router;


// ========== 3. 邮件服务集成队列 ==========
// src/services/emailService.js

const nodemailer = require('nodemailer');
const QueueService = require('./queueService');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * 发送邮件（直接发送）
   */
  async send(to, subject, html, attachments = []) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
        attachments
      });

      logger.info(`邮件发送成功: ${to}`, { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('邮件发送失败:', error);
      throw error;
    }
  }

  /**
   * 异步发送邮件（使用队列）
   */
  async sendAsync(to, subject, html, options = {}) {
    return await QueueService.sendEmail(to, subject, html, {
      priority: options.priority || 1,
      delay: options.delay || 0
    });
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>欢迎加入IEclub！</h2>
        <p>你好 ${user.nickname}，</p>
        <p>请点击下面的链接验证你的邮箱：</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        ">验证邮箱</a>
        <p>或者复制以下链接到浏览器：</p>
        <p style="color: #666;">${verifyUrl}</p>
        <p>此链接将在24小时后失效。</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          这是一封自动发送的邮件，请勿回复。
        </p>
      </div>
    `;

    return await this.sendAsync(
      user.email,
      'IEclub - 邮箱验证',
      html,
      { priority: 3 } // 高优先级
    );
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>重置密码</h2>
        <p>你好 ${user.nickname}，</p>
        <p>我们收到了你的密码重置请求。请点击下面的链接重置密码：</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        ">重置密码</a>
        <p>或者复制以下链接到浏览器：</p>
        <p style="color: #666;">${resetUrl}</p>
        <p>此链接将在1小时后失效。</p>
        <p style="color: #ff6b6b; font-weight: bold;">
          如果这不是你的操作，请忽略此邮件。
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          这是一封自动发送的邮件，请勿回复。
        </p>
      </div>
    `;

    return await this.sendAsync(
      user.email,
      'IEclub - 密码重置',
      html,
      { priority: 4 } // 高优先级
    );
  }

  /**
   * 批量发送活动通知
   */
  async sendEventNotifications(event, users) {
    const emails = users.map(user => ({
      to: user.email,
      subject: `IEclub活动通知 - ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${event.title}</h2>
          <p>你好 ${user.nickname}，</p>
          <p>你关注的活动即将开始：</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${event.title}</h3>
            <p><strong>时间：</strong>${event.startTime}</p>
            <p><strong>地点：</strong>${event.location}</p>
            <p><strong>描述：</strong>${event.description}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/events/${event.id}" style="
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
          ">查看详情</a>
        </div>
      `,
      priority: 2
    }));

    return await QueueService.sendBulkEmails(emails);
  }
}

module.exports = new EmailService();


// ========== 4. OCR服务集成队列 ==========
// src/controllers/ocrController.js

const QueueService = require('../services/queueService');
const CacheService = require('../services/cacheService');
const { OCRRecord } = require('../models');

class OCRController {
  /**
   * 上传并识别图片
   */
  static async recognizeImage(req, res) {
    try {
      const userId = req.user.id;
      const imagePath = req.file.path;

      // 创建OCR记录
      const record = await OCRRecord.create({
        userId,
        imagePath,
        status: 'pending'
      });

      // 添加到队列异步处理
      const job = await QueueService.recognizeText(
        imagePath,
        userId,
        record.id
      );

      res.status(202).json({
        success: true,
        message: '图片已上传，正在识别中...',
        data: {
          recordId: record.id,
          jobId: job.id,
          status: 'processing'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 查询识别结果
   */
  static async getRecognitionResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const record = await OCRRecord.findOne({
        where: { id, userId }
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          error: '记录不存在'
        });
      }

      res.json({
        success: true,
        data: {
          id: record.id,
          status: record.status,
          result: record.result,
          confidence: record.confidence,
          createdAt: record.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取任务状态
   */
  static async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;

      const status = await QueueService.getJobStatus('ocr', jobId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = OCRController;


// ========== 5. 监控和统计端点 ==========
// src/controllers/metricsController.js

const redis = require('../utils/redis');
const { queueManager } = require('../utils/queue');
const CacheService = require('../services/cacheService');

class MetricsController {
  /**
   * 获取Redis状态
   */
  static async getRedisStatus(req, res) {
    try {
      const isConnected = await redis.ping();
      const stats = await CacheService.getCacheStats();

      res.json({
        success: true,
        data: {
          connected: isConnected,
          ...stats
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取队列状态
   */
  static async getQueueStatus(req, res) {
    try {
      const statuses = await queueManager.getAllQueueStatus();

      res.json({
        success: true,
        data: statuses
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取特定队列详情
   */
  static async getQueueDetails(req, res) {
    try {
      const { queueName } = req.params;
      const status = await queueManager.getQueueStatus(queueName);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: '队列不存在'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 暂停队列
   */
  static async pauseQueue(req, res) {
    try {
      const { queueName } = req.params;
      await queueManager.pauseQueue(queueName);

      res.json({
        success: true,
        message: `队列 ${queueName} 已暂停`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 恢复队列
   */
  static async resumeQueue(req, res) {
    try {
      const { queueName } = req.params;
      await queueManager.resumeQueue(queueName);

      res.json({
        success: true,
        message: `队列 ${queueName} 已恢复`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 清理队列
   */
  static async cleanQueue(req, res) {
    try {
      const { queueName } = req.params;
      await queueManager.cleanQueue(queueName);

      res.json({
        success: true,
        message: `队列 ${queueName} 已清理`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 重试失败任务
   */
  static async retryFailedJobs(req, res) {
    try {
      const { queueName } = req.params;
      const count = await queueManager.retryFailed(queueName);

      res.json({
        success: true,
        message: `已重试 ${count} 个失败任务`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 清除所有缓存
   */
  static async clearAllCache(req, res) {
    try {
      await CacheService.clearAll();

      res.json({
        success: true,
        message: '所有缓存已清除'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = MetricsController;


// ========== 6. 监控路由 ==========
// src/routes/metrics.js

const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metricsController');
const auth = require('../middleware/auth');

// 需要管理员权限
const adminAuth = [auth.required, auth.isAdmin];

// Redis状态
router.get('/redis', adminAuth, MetricsController.getRedisStatus);

// 队列状态
router.get('/queues', adminAuth, MetricsController.getQueueStatus);
router.get('/queues/:queueName', adminAuth, MetricsController.getQueueDetails);

// 队列管理
router.post('/queues/:queueName/pause', adminAuth, MetricsController.pauseQueue);
router.post('/queues/:queueName/resume', adminAuth, MetricsController.resumeQueue);
router.post('/queues/:queueName/clean', adminAuth, MetricsController.cleanQueue);
router.post('/queues/:queueName/retry', adminAuth, MetricsController.retryFailedJobs);

// 缓存管理
router.delete('/cache', adminAuth, MetricsController.clearAllCache);

module.exports = router;


// ========== 7. 健康检查集成Redis ==========
// src/utils/healthCheck.js

const redis = require('./redis');
const { queueManager } = require('./queue');

class HealthCheck {
  /**
   * 完整健康检查
   */
  static async check() {
    const results = {
      status: 'healthy',
      timestamp: new Date(),
      services: {}
    };

    // 检查Redis
    try {
      const redisOk = await redis.ping();
      results.services.redis = {
        status: redisOk ? 'up' : 'down',
        connected: redis.isConnected
      };

      if (!redisOk) {
        results.status = 'unhealthy';
      }
    } catch (error) {
      results.services.redis = {
        status: 'down',
        error: error.message
      };
      results.status = 'unhealthy';
    }

    // 检查队列
    try {
      const queueStatus = await queueManager.getAllQueueStatus();
      results.services.queues = queueStatus;
    } catch (error) {
      results.services.queues = {
        status: 'error',
        error: error.message
      };
      results.status = 'degraded';
    }

    // 检查数据库
    try {
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      results.services.database = { status: 'up' };
    } catch (error) {
      results.services.database = {
        status: 'down',
        error: error.message
      };
      results.status = 'unhealthy';
    }

    return results;
  }
}

module.exports = HealthCheck;


// ========== 8. package.json 需要添加的依赖 ==========
/*
{
  "dependencies": {
    "ioredis": "^5.3.2",
    "bull": "^4.12.0",
    "nodemailer": "^6.9.7"
  }
}

安装命令：
npm install ioredis bull nodemailer
*/


// ========== 9. 启动脚本更新 ==========
// start-dev.bat 或 npm scripts

/*
@echo off
echo Starting IEclub Backend with Redis...

REM 检查Redis是否运行
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo Redis is not running! Starting Redis...
    start redis-server
    timeout /t 3
)

echo Redis is running
npm run dev
*/

























// ==================== .env.example 添加Redis配置 ====================
// Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

// 队列配置
QUEUE_CONCURRENCY=5
QUEUE_REDIS_DB=1


// ==================== src/app.js 初始化Redis ====================
const express = require('express');
const redis = require('./utils/redis');
const { queueManager } = require('./utils/queue');
const logger = require('./utils/logger');

const app = express();

// 初始化Redis
redis.init().catch(err => {
  logger.error('Redis初始化失败:', err);
  // 根据需要决定是否继续运行
  // process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  
  // 关闭队列
  await queueManager.closeAll();
  
  // 关闭Redis
  await redis.close();
  
  // 关闭服务器
  process.exit(0);
});

module.exports = app;
