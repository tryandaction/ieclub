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

