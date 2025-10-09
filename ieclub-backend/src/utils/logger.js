
// ==================== src/utils/logger.js （增强版）====================
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * 结构化日志系统
 */
class Logger {
  constructor() {
    // 日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ fillWith: ['timestamp', 'level', 'message'] }),
      winston.format.json()
    );

    // 控制台格式（彩色）
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0 && meta.metadata) {
          metaStr = '\n' + JSON.stringify(meta.metadata, null, 2);
        }
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );

    // 创建logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { 
        service: 'ieclub-backend',
        environment: process.env.NODE_ENV 
      },
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: consoleFormat,
          level: 'debug'
        }),

        // 所有日志（按日期轮转）
        new DailyRotateFile({
          filename: path.join('logs', 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat
        }),

        // 错误日志
        new DailyRotateFile({
          filename: path.join('logs', 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat
        }),

        // 性能日志
        new DailyRotateFile({
          filename: path.join('logs', 'performance-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          format: logFormat,
          level: 'info'
        })
      ],

      // 异常处理
      exceptionHandlers: [
        new DailyRotateFile({
          filename: path.join('logs', 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d'
        })
      ],

      // 未捕获的Promise rejection
      rejectionHandlers: [
        new DailyRotateFile({
          filename: path.join('logs', 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d'
        })
      ]
    });

    // 生产环境不输出debug日志
    if (process.env.NODE_ENV === 'production') {
      this.logger.transports[0].level = 'info';
    }
  }

  /**
   * Debug日志
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Info日志
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Warning日志
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
    
    // 发送到Sentry
    if (process.env.SENTRY_DSN) {
      const Sentry = require('./config/sentry');
      Sentry.captureMessage(message, 'warning', { extra: meta });
    }
  }

  /**
   * Error日志
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
        ...error
      } : undefined
    };

    this.logger.error(message, errorMeta);

    // 发送到Sentry
    if (process.env.SENTRY_DSN && error) {
      const Sentry = require('../config/sentry');
      Sentry.captureException(error, {
        tags: meta.tags || {},
        extra: meta
      });
    }
  }

  /**
   * HTTP请求日志
   */
  http(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      this.warn('HTTP请求失败', logData);
    } else if (duration > 1000) {
      this.warn('HTTP请求缓慢', logData);
    } else {
      this.info('HTTP请求', logData);
    }
  }

  /**
   * 数据库查询日志
   */
  query(query, duration, error = null) {
    const logData = {
      query: query.length > 200 ? query.substring(0, 200) + '...' : query,
      duration: `${duration}ms`,
      slow: duration > 100
    };

    if (error) {
      this.error('数据库查询失败', error, logData);
    } else if (duration > 100) {
      this.warn('慢查询', logData);
    } else {
      this.debug('数据库查询', logData);
    }
  }

  /**
   * 性能日志
   */
  performance(operation, duration, metadata = {}) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...metadata
    };

    if (duration > 1000) {
      this.warn('性能警告', logData);
    } else {
      this.info('性能统计', logData);
    }
  }

  /**
   * 业务日志
   */
  business(action, data = {}) {
    this.info(`业务操作: ${action}`, {
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 安全日志
   */
  security(event, data = {}) {
    this.warn(`安全事件: ${event}`, {
      event,
      ...data,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });

    // 安全事件始终发送到Sentry
    if (process.env.SENTRY_DSN) {
      const Sentry = require('../config/sentry');
      Sentry.captureMessage(`安全事件: ${event}`, 'warning', {
        tags: { type: 'security' },
        extra: data
      });
    }
  }
}

module.exports = new Logger();