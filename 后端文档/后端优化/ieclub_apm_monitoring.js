// ==================== src/config/sentry.js ====================
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Sentry配置（错误追踪和性能监控）
 */
class SentryConfig {
  static init(app) {
    if (!process.env.SENTRY_DSN) {
      console.warn('⚠️  Sentry DSN未配置，跳过初始化');
      return;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // 性能监控
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // 性能分析
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      integrations: [
        // Express集成
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
        
        // 数据库查询追踪
        new Sentry.Integrations.Mysql(),
        new Sentry.Integrations.Postgres(),
        
        // Redis追踪
        new Sentry.Integrations.Redis(),
      ],

      // 忽略的错误
      ignoreErrors: [
        'SequelizeConnectionError',
        'ECONNREFUSED',
        'ETIMEDOUT',
        /jwt.*/i
      ],

      // 忽略的URL
      ignoreUrls: [
        /\/health/,
        /\/favicon\.ico/,
        /\/__webpack_hmr/
      ],

      // 敏感数据过滤
      beforeSend(event, hint) {
        // 移除密码字段
        if (event.request && event.request.data) {
          if (event.request.data.password) {
            event.request.data.password = '[Filtered]';
          }
          if (event.request.data.token) {
            event.request.data.token = '[Filtered]';
          }
        }

        // 移除cookie中的敏感信息
        if (event.request && event.request.cookies) {
          delete event.request.cookies.token;
          delete event.request.cookies.session;
        }

        return event;
      },

      // 添加上下文信息
      beforeBreadcrumb(breadcrumb, hint) {
        if (breadcrumb.category === 'http') {
          breadcrumb.data = breadcrumb.data || {};
          breadcrumb.data.timestamp = Date.now();
        }
        return breadcrumb;
      }
    });

    console.log('✅ Sentry已初始化');
  }

  /**
   * 请求处理中间件
   */
  static requestHandler() {
    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'nickname'],
      ip: true,
      request: true,
      transaction: true
    });
  }

  /**
   * 追踪中间件
   */
  static tracingHandler() {
    return Sentry.Handlers.tracingHandler();
  }

  /**
   * 错误处理中间件
   */
  static errorHandler() {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // 只报告500错误
        return error.status >= 500;
      }
    });
  }

  /**
   * 手动捕获异常
   */
  static captureException(error, context = {}) {
    Sentry.captureException(error, {
      tags: context.tags || {},
      extra: context.extra || {},
      level: context.level || 'error'
    });
  }

  /**
   * 捕获消息
   */
  static captureMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
      level,
      tags: context.tags || {},
      extra: context.extra || {}
    });
  }

  /**
   * 设置用户上下文
   */
  static setUser(user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.nickname
    });
  }

  /**
   * 清除用户上下文
   */
  static clearUser() {
    Sentry.setUser(null);
  }

  /**
   * 添加面包屑
   */
  static addBreadcrumb(breadcrumb) {
    Sentry.addBreadcrumb({
      timestamp: Date.now(),
      ...breadcrumb
    });
  }

  /**
   * 性能追踪
   */
  static startTransaction(name, op = 'http.server') {
    return Sentry.startTransaction({
      name,
      op,
      trimEnd: true
    });
  }

  /**
   * 创建span
   */
  static startSpan(transaction, name, op) {
    return transaction.startChild({
      op,
      description: name
    });
  }
}

module.exports = SentryConfig;


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

      // 创建Sentry事务
      const transaction = SentryConfig.startTransaction(
        `${req.method} ${req.path}`,
        'http.server'
      );

      req.sentryTransaction = transaction;

      // 原始end方法
      const originalEnd = res.end;

      res.end = function(...args) {
        const duration = Date.now() - startTime;

        // 记录请求日志
        logger.http(req, res, duration);

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


// ==================== src/middleware/metricsCollector.js ====================
const prometheus = require('prom-client');

/**
 * Prometheus指标收集器
 */
class MetricsCollector {
  constructor() {
    // 创建注册表
    this.register = new prometheus.Registry();

    // 默认指标（CPU、内存等）
    prometheus.collectDefaultMetrics({ 
      register: this.register,
      prefix: 'ieclub_'
    });

    // HTTP请求计数器
    this.httpRequestCounter = new prometheus.Counter({
      name: 'ieclub_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.register]
    });

    // HTTP请求耗时直方图
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'ieclub_http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'path', 'status'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.register]
    });

    // 数据库查询计数器
    this.dbQueryCounter = new prometheus.Counter({
      name: 'ieclub_db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['type'],
      registers: [this.register]
    });

    // 数据库查询耗时
    this.dbQueryDuration = new prometheus.Histogram({
      name: 'ieclub_db_query_duration_ms',
      help: 'Duration of database queries in ms',
      labelNames: ['type'],
      buckets: [10, 25, 50, 100, 250, 500, 1000],
      registers: [this.register]
    });

    // Redis操作计数器
    this.redisCounter = new prometheus.Counter({
      name: 'ieclub_redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['operation', 'status'],
      registers: [this.register]
    });

    // 活跃用户数
    this.activeUsers = new prometheus.Gauge({
      name: 'ieclub_active_users',
      help: 'Number of currently active users',
      registers: [this.register]
    });

    // 队列任务计数器
    this.queueJobCounter = new prometheus.Counter({
      name: 'ieclub_queue_jobs_total',
      help: 'Total number of queue jobs',
      labelNames: ['queue', 'status'],
      registers: [this.register]
    });
  }

  /**
   * HTTP请求指标中间件
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const labels = {
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode
        };

        this.httpRequestCounter.inc(labels);
        this.httpRequestDuration.observe(labels, duration);
      });

      next();
    };
  }

  /**
   * 记录数据库查询
   */
  recordDbQuery(type, duration) {
    this.dbQueryCounter.inc({ type });
    this.dbQueryDuration.observe({ type }, duration);
  }

  /**
   * 记录Redis操作
   */
  recordRedisOperation(operation, status = 'success') {
    this.redisCounter.inc({ operation, status });
  }

  /**
   * 更新活跃用户数
   */
  updateActiveUsers(count) {
    this.activeUsers.set(count);
  }

  /**
   * 记录队列任务
   */
  recordQueueJob(queue, status) {
    this.queueJobCounter.inc({ queue, status });
  }

  /**
   * 获取所有指标
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * 获取特定指标
   */
  getMetric(name) {
    return this.register.getSingleMetric(name);
  }
}

module.exports = new MetricsCollector();


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


// ==================== 在 app.js 中集成 ====================
const express = require('express');
const SentryConfig = require('./config/sentry');
const PerformanceMiddleware = require('./middleware/performance');
const metricsCollector = require('./middleware/metricsCollector');
const metricsRouter = require('./routes/metrics');

const app = express();

// 1. 初始化Sentry（必须在所有中间件之前）
SentryConfig.init(app);

// 2. Sentry请求处理
app.use(SentryConfig.requestHandler());
app.use(SentryConfig.tracingHandler());

// 3. 性能监控
app.use(PerformanceMiddleware.requestTiming());
app.use(metricsCollector.middleware());

// 4. 其他中间件...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. 路由
app.use('/api/metrics', metricsRouter);

// 6. Sentry错误处理（必须在所有路由之后）
app.use(SentryConfig.errorHandler());

// 7. 启动后台监控
PerformanceMiddleware.memoryMonitoring();
PerformanceMiddleware.cpuMonitoring();
PerformanceMiddleware.eventLoopMonitoring();


// ==================== package.json 依赖 ====================
/*
{
  "dependencies": {
    "@sentry/node": "^7.91.0",
    "@sentry/profiling-node": "^1.3.1",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "prom-client": "^15.1.0"
  }
}

安装命令：
npm install @sentry/node @sentry/profiling-node winston winston-daily-rotate-file prom-client
*/


// ==================== .env 配置 ====================
/*
# Sentry配置
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 日志级别
LOG_LEVEL=info

# 性能监控
ENABLE_METRICS=true
METRICS_PORT=9090
*/