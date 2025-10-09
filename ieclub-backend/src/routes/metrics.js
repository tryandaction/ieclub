
// ==================== src/routes/metrics.js ====================
const express = require('express');
const router = express.Router();
const metricsCollector = require('../middleware/metricsCollector');
const auth = require('../middleware/auth');
const redis = require('../utils/redis');
const { queueManager } = require('../utils/queue');

/**
 * Prometheus指标端点
 */
router.get('/prometheus', async (req, res) => {
  try {
    res.set('Content-Type', metricsCollector.register.contentType);
    res.end(await metricsCollector.getMetrics());
  } catch (error) {
    res.status(500).end(error.message);
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
    await sequelize.authenticate();
    health.services.database = { status: 'up', responseTime: '< 10ms' };
  } catch (error) {
    health.services.database = { status: 'down', error: error.message };
    health.status = 'unhealthy';
  }

  // 检查Redis
  try {
    const start = Date.now();
    await redis.ping();
    health.services.redis = { 
      status: 'up', 
      responseTime: `${Date.now() - start}ms` 
    };
  } catch (error) {
    health.services.redis = { status: 'down', error: error.message };
    health.status = 'degraded';
  }

  // 检查队列
  try {
    const queueStatus = await queueManager.getAllQueueStatus();
    health.services.queues = queueStatus;
  } catch (error) {
    health.services.queues = { status: 'error', error: error.message };
  }

  // 系统资源
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

  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * 详细统计信息（需要管理员权限）
 */
router.get('/stats', [auth.required, auth.isAdmin], async (req, res) => {
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

      // Redis统计
      redis: await redis.info(),

      // 队列统计
      queues: await queueManager.getAllQueueStatus(),

      // 数据库统计
      database: await getDatabaseStats()
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取数据库统计
 */
async function getDatabaseStats() {
  const { sequelize, User, Post, Event } = require('../models');

  const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users');
  const [postCount] = await sequelize.query('SELECT COUNT(*) as count FROM posts');
  const [eventCount] = await sequelize.query('SELECT COUNT(*) as count FROM events');

  return {
    users: userCount[0].count,
    posts: postCount[0].count,
    events: eventCount[0].count
  };
}

module.exports = router;