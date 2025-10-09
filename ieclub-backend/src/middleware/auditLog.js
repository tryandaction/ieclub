// ==================== src/middleware/auditLog.js ====================
const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * 审计日志中间件
 */
class AuditLogMiddleware {
  /**
   * 记录操作日志
   */
  static log(options = {}) {
    const {
      action = null,
      resource = null,
      includeBody = false,
      includeResponse = false
    } = options;

    return async (req, res, next) => {
      const startTime = Date.now();
      const originalJson = res.json.bind(res);

      // 收集请求信息
      const logData = {
        userId: req.user?.id || null,
        action: action || `${req.method} ${req.path}`,
        resource: resource || req.path.split('/')[2],
        ip: req.ip,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.originalUrl,
        params: req.params,
        query: req.query,
        timestamp: new Date()
      };

      // 可选：记录请求体
      if (includeBody && req.body) {
        // 移除敏感字段
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.token;
        logData.requestBody = sanitizedBody;
      }

      // 重写res.json以记录响应
      res.json = async function(data) {
        const duration = Date.now() - startTime;
        
        logData.statusCode = res.statusCode;
        logData.duration = duration;
        logData.success = res.statusCode >= 200 && res.statusCode < 400;

        // 可选：记录响应
        if (includeResponse) {
          logData.response = data;
        }

        // 异步保存到数据库
        AuditLog.create(logData).catch(err => {
          logger.error('保存审计日志失败:', err);
        });

        // 记录到文件日志
        logger.info('审计日志', logData);

        return originalJson(data);
      };

      next();
    };
  }

  /**
   * 记录敏感操作
   */
  static logSensitiveOperation() {
    return this.log({
      includeBody: true,
      includeResponse: true
    });
  }

  /**
   * 查询审计日志
   */
  static async query(filters = {}) {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.like]: `%${action}%` };
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 导出审计日志
   */
  static async export(filters = {}, format = 'json') {
    const logs = await this.query({ ...filters, limit: 10000 });
    
    if (format === 'csv') {
      return this.convertToCSV(logs.data);
    }
    
    return logs;
  }

  /**
   * 转换为CSV格式
   */
  static convertToCSV(logs) {
    const headers = ['时间', '用户ID', '操作', '资源', 'IP', '状态码', '耗时'];
    const rows = logs.map(log => [
      log.timestamp,
      log.userId || '匿名',
      log.action,
      log.resource,
      log.ip,
      log.statusCode,
      log.duration
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  /**
   * 清理旧日志
   */
  static async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await AuditLog.destroy({
      where: {
        timestamp: { [Op.lt]: cutoffDate }
      }
    });

    logger.info(`清理了 ${deleted} 条审计日志`);
    return deleted;
  }
}

module.exports = AuditLogMiddleware;