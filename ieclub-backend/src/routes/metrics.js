
// ==================== src/routes/metrics.js ====================
const express = require('express');
const router = express.Router();

// 安全地导入依赖
let metricsCollector, auth, redis, queueManager;

try {
  metricsCollector = require('../middleware/metricsCollector');
} catch (error) {
  console.warn('Metrics collector not available:', error.message);
}

try {
  auth = require('../middleware/auth');
} catch (error) {
  console.warn('Auth middleware not available:', error.message);
}

try {
  redis = require('../utils/redis');
} catch (error) {
  console.warn('Redis not available:', error.message);
}

try {
  const queueModule = require('../utils/queue');
  queueManager = queueModule.queueManager;
} catch (error) {
  console.warn('Queue manager not available:', error.message);
}

/**
 * Prometheus指标端点
 */
router.get('/prometheus', async (req, res) => {
  try {
    if (metricsCollector && metricsCollector.register && metricsCollector.getMetrics) {
      res.set('Content-Type', metricsCollector.register.contentType);
      const metrics = await metricsCollector.getMetrics();
      res.end(metrics);
    } else {
      res.status(503).end('Metrics collector not available');
    }
  } catch (error) {
    console.error('Prometheus metrics error:', error);
    res.status(500).end(`Error: ${error.message}`);
  }
});

/**
 * 系统健康检查（增强版）
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // 检查数据库
  try {
    const { sequelize } = require('../models');
    if (sequelize) {
      await sequelize.authenticate();
      health.services.database = { status: 'up', responseTime: '< 10ms' };
    } else {
      health.services.database = { status: 'down', error: 'Sequelize not initialized' };
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.services.database = { status: 'down', error: error.message };
    health.status = 'unhealthy';
  }

  // 检查Redis
  try {
    if (redis && typeof redis.ping === 'function') {
      const start = Date.now();
      await redis.ping();
      health.services.redis = {
        status: 'up',
        responseTime: `${Date.now() - start}ms`
      };
    } else {
      health.services.redis = { status: 'disabled', message: 'Redis not available' };
    }
  } catch (error) {
    health.services.redis = { status: 'down', error: error.message };
    health.status = 'degraded';
  }

  // 检查队列
  try {
    if (queueManager && typeof queueManager.getAllQueueStatus === 'function') {
      const queueStatus = await queueManager.getAllQueueStatus();
      health.services.queues = queueStatus;
    } else {
      health.services.queues = { status: 'disabled', message: 'Queue manager not available' };
    }
  } catch (error) {
    health.services.queues = { status: 'error', error: error.message };
  }

  // 系统资源
  try {
    const memUsage = process.memoryUsage();
    health.system = {
      memory: {
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        percentage: `${Math.round(memUsage.heapUsed / memUsage.heapTotal * 100)}%`
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system
      }
    };
  } catch (error) {
    health.system = { status: 'error', error: error.message };
  }

  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * 详细统计信息（暂时不需要管理员权限）
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),

      // 进程信息
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },

      // 内存信息
      memory: process.memoryUsage(),

      // CPU信息
      cpu: process.cpuUsage(),

      // Redis统计（安全处理）
      redis: redis ? await redis.info().catch(() => ({ status: 'error', message: 'Redis unavailable' })) : { status: 'disabled' },

      // 队列统计（安全处理）
      queues: await queueManager.getAllQueueStatus().catch(() => ({ status: 'error', message: 'Queue manager unavailable' })),

      // 数据库统计（安全处理）
      database: await getDatabaseStats().catch(() => ({ status: 'error', message: 'Database unavailable' }))
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取数据库统计
 */
async function getDatabaseStats() {
  try {
    const { sequelize } = require('../models');

    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [postCount] = await sequelize.query('SELECT COUNT(*) as count FROM posts');
    const [eventCount] = await sequelize.query('SELECT COUNT(*) as count FROM events');

    return {
      users: userCount[0].count,
      posts: postCount[0].count,
      events: eventCount[0].count
    };
  } catch (error) {
    console.error('Database stats error:', error);
    return {
      status: 'error',
      message: 'Database query failed',
      error: error.message
    };
  }
}

module.exports = router;