
// ==================== src/controllers/metricsController.js ====================
const { Op, sequelize } = require('sequelize');
const metrics = require('../utils/metrics');
const HealthCheck = require('../utils/healthCheck');
const { AuditLog } = require('../models');

/**
 * 监控指标控制器
 */
class MetricsController {
  /**
   * 获取系统指标
   */
  static async getMetrics(req, res) {
    try {
      const format = req.query.format || 'json';
      const data = metrics.getMetrics();

      if (format === 'prometheus') {
        res.set('Content-Type', 'text/plain');
        res.send(metrics.exportPrometheus());
      } else {
        res.json({
          success: true,
          data
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取指标失败',
        error: error.message
      });
    }
  }

  /**
   * 健康检查
   */
  static async healthCheck(req, res) {
    try {
      const detailed = req.query.detailed === 'true';
      
      const health = detailed 
        ? await HealthCheck.check()
        : await HealthCheck.quickCheck();

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  /**
   * 获取审计日志统计
   */
  static async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const where = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const stats = await AuditLog.findAll({
        where,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration']
        ],
        group: ['action']
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取统计失败',
        error: error.message
      });
    }
  }

  /**
   * 系统信息
   */
  static getSystemInfo(req, res) {
    const os = require('os');
    
    res.json({
      success: true,
      data: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
        uptime: os.uptime(),
        nodeVersion: process.version,
        pid: process.pid
      }
    });
  }
}

module.exports = MetricsController;