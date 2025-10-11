// ==================== src/middleware/performance.js ====================
const logger = require('../utils/logger');
const SentryConfig = require('../config/sentry');

/**
 * 性能监控中间件
 */
class PerformanceMiddleware {
  /**
   * 请求性能追踪
   */
  static requestTiming() {
    return (req, res, next) => {
      const startTime = Date.now();

      // 创建Sentry事务（如果Sentry已初始化）
      let transaction = null;
      if (process.env.SENTRY_DSN) {
        try {
          transaction = SentryConfig.startTransaction(
            `${req.method} ${req.path}`,
            'http.server'
          );
          req.sentryTransaction = transaction;
        } catch (error) {
          // Sentry未初始化，跳过
        }
      }

      // 原始end方法
      const originalEnd = res.end;

      res.end = function(...args) {
        const duration = Date.now() - startTime;

        // 记录请求日志（暂时注释掉，避免与健康检查冲突）
        // logger.http(req, res, duration);

        // 性能警告
        if (duration > 1000) {
          logger.warn('请求响应慢', {
            method: req.method,
            url: req.originalUrl,
            duration: `${duration}ms`,
            statusCode: res.statusCode
          });
        }

        // 完成Sentry事务
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * 数据库查询性能监控
   */
  static databaseTiming(sequelize) {
    sequelize.addHook('beforeQuery', (options) => {
      options.startTime = Date.now();
    });

    sequelize.addHook('afterQuery', (options, query) => {
      const duration = Date.now() - options.startTime;
      
      logger.query(query.sql, duration);

      // 慢查询告警
      if (duration > 100) {
        logger.warn('数据库慢查询', {
          sql: query.sql,
          duration: `${duration}ms`,
          bindings: query.bind
        });
      }
    });
  }

  /**
   * Redis性能监控
   */
  static redisTiming(redis) {
    const originalSendCommand = redis.sendCommand;

    redis.sendCommand = function(command) {
      const startTime = Date.now();
      const result = originalSendCommand.apply(this, arguments);

      result.then(() => {
        const duration = Date.now() - startTime;
        
        if (duration > 50) {
          logger.warn('Redis慢命令', {
            command: command.name,
            args: command.args,
            duration: `${duration}ms`
          });
        }
      });

      return result;
    };
  }

  /**
   * 内存使用监控
   */
  static memoryMonitoring(intervalMs = 60000) {
    setInterval(() => {
      const used = process.memoryUsage();
      const memoryData = {
        rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(used.external / 1024 / 1024)}MB`
      };

      logger.info('内存使用情况', memoryData);

      // 内存告警（超过1GB）
      if (used.heapUsed > 1024 * 1024 * 1024) {
        logger.warn('内存使用过高', memoryData);
      }
    }, intervalMs);
  }

  /**
   * CPU使用监控
   */
  static cpuMonitoring(intervalMs = 60000) {
    let lastUsage = process.cpuUsage();
    let lastTime = Date.now();

    setInterval(() => {
      const currentUsage = process.cpuUsage(lastUsage);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime;

      const cpuPercent = {
        user: (currentUsage.user / 1000 / timeDiff * 100).toFixed(2),
        system: (currentUsage.system / 1000 / timeDiff * 100).toFixed(2)
      };

      logger.info('CPU使用情况', cpuPercent);

      // CPU告警（超过80%）
      if (parseFloat(cpuPercent.user) > 80) {
        logger.warn('CPU使用率过高', cpuPercent);
      }

      lastUsage = process.cpuUsage();
      lastTime = currentTime;
    }, intervalMs);
  }

  /**
   * 事件循环监控
   */
  static eventLoopMonitoring(intervalMs = 10000) {
    const start = Date.now();
    let lastCheck = start;

    setInterval(() => {
      const now = Date.now();
      const delay = now - lastCheck - intervalMs;

      if (delay > 100) {
        logger.warn('事件循环阻塞', {
          delay: `${delay}ms`,
          expected: `${intervalMs}ms`
        });
      }

      lastCheck = now;
    }, intervalMs);
  }

  /**
   * 性能指标收集
   */
  static collectMetrics() {
    return (req, res, next) => {
      const startTime = process.hrtime();

      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        // 收集指标
        const metrics = {
          timestamp: Date.now(),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          memoryUsage: process.memoryUsage().heapUsed,
          userAgent: req.get('user-agent')
        };

        // 发送到指标系统（可选：Prometheus、Grafana等）
        this.sendMetrics(metrics);
      });

      next();
    };
  }

  /**
   * 发送指标到监控系统
   */
  static sendMetrics(metrics) {
    // 这里可以集成Prometheus、InfluxDB等
    // 示例：存储到Redis或发送到监控服务
    logger.debug('性能指标', metrics);
  }
}

module.exports = PerformanceMiddleware;
