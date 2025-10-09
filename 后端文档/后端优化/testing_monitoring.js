// ==================== tests/setup.js ====================
/**
 * Jest测试环境配置
 */
const { sequelize } = require('../src/models');

// 测试前初始化
beforeAll(async () => {
  // 连接测试数据库
  await sequelize.authenticate();
  
  // 同步数据库模型
  await sequelize.sync({ force: true });
  
  console.log('测试数据库已初始化');
});

// 每个测试后清理
afterEach(async () => {
  // 清理测试数据（可选）
});

// 所有测试完成后
afterAll(async () => {
  // 关闭数据库连接
  await sequelize.close();
  console.log('测试数据库连接已关闭');
});

// 全局测试工具
global.testHelpers = {
  // 创建测试用户
  createTestUser: async (userData = {}) => {
    const { User } = require('../src/models');
    return await User.create({
      email: `test${Date.now()}@sustech.edu.cn`,
      password: 'password123',
      username: '测试用户',
      studentId: '12012345',
      ...userData
    });
  },
  
  // 生成测试Token
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};


// ==================== tests/integration/auth.test.js ====================
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        email: `test${Date.now()}@sustech.edu.cn`,
        password: 'Password123!',
        username: '测试用户',
        studentId: '12012345'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('应该拒绝非南科大邮箱', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@gmail.com',
          password: 'Password123!',
          username: '测试',
          studentId: '12012345'
        })
        .expect(400);

      expect(res.body.message).toContain('邮箱');
    });

    it('应该拒绝重复邮箱', async () => {
      const email = `test${Date.now()}@sustech.edu.cn`;
      
      await User.create({
        email,
        password: 'password',
        username: '用户1',
        studentId: '12012345'
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          username: '用户2',
          studentId: '12012346'
        })
        .expect(400);

      expect(res.body.message).toContain('存在');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
    });

    it('应该成功登录', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('应该拒绝错误密码', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body.message).toContain('密码');
    });
  });
});


// ==================== tests/unit/utils/validator.test.js ====================
const Validator = require('../../../src/utils/validator');

describe('Validator Utils', () => {
  describe('isEmail', () => {
    it('应该验证有效邮箱', () => {
      expect(Validator.isEmail('test@sustech.edu.cn')).toBe(true);
      expect(Validator.isEmail('user@mail.sustech.edu.cn')).toBe(true);
    });

    it('应该拒绝无效邮箱', () => {
      expect(Validator.isEmail('invalid')).toBe(false);
      expect(Validator.isEmail('test@')).toBe(false);
      expect(Validator.isEmail('@sustech.edu.cn')).toBe(false);
    });
  });

  describe('validateFields', () => {
    it('应该验证所有字段', () => {
      const data = {
        email: 'test@sustech.edu.cn',
        password: 'Password123!',
        username: '测试用户'
      };

      const rules = {
        email: { required: true, type: 'email' },
        password: { required: true, minLength: 8 },
        username: { required: true, minLength: 2, maxLength: 20 }
      };

      const errors = Validator.validateFields(data, rules);
      expect(errors).toHaveLength(0);
    });

    it('应该返回验证错误', () => {
      const data = {
        email: 'invalid',
        password: '123',
        username: 'a'
      };

      const rules = {
        email: { required: true, type: 'email' },
        password: { required: true, minLength: 8 },
        username: { required: true, minLength: 2 }
      };

      const errors = Validator.validateFields(data, rules);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});


// ==================== src/utils/metrics.js ====================
/**
 * 业务指标监控
 */
class Metrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  /**
   * 增加计数器
   */
  increment(key, value = 1, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    const current = this.counters.get(labelKey) || 0;
    this.counters.set(labelKey, current + value);
  }

  /**
   * 设置仪表值
   */
  gauge(key, value, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    this.gauges.set(labelKey, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 记录直方图数据
   */
  histogram(key, value, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    const data = this.histograms.get(labelKey) || [];
    data.push({ value, timestamp: Date.now() });
    
    // 只保留最近1000个数据点
    if (data.length > 1000) {
      data.shift();
    }
    
    this.histograms.set(labelKey, data);
  }

  /**
   * 计时器
   */
  timer(key, labels = {}) {
    const start = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - start;
        this.histogram(`${key}_duration`, duration, labels);
        return duration;
      }
    };
  }

  /**
   * 获取标签键
   */
  getLabelKey(key, labels) {
    if (Object.keys(labels).length === 0) return key;
    
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${key}{${labelStr}}`;
  }

  /**
   * 获取所有指标
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: this.getHistogramStats(),
      system: this.getSystemMetrics()
    };
  }

  /**
   * 获取直方图统计
   */
  getHistogramStats() {
    const stats = {};
    
    for (const [key, data] of this.histograms) {
      const values = data.map(d => d.value).sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      
      stats[key] = {
        count,
        sum,
        avg: sum / count,
        min: values[0],
        max: values[count - 1],
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    }
    
    return stats;
  }

  /**
   * 计算百分位数
   */
  percentile(sortedValues, percentile) {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[index];
  }

  /**
   * 获取系统指标
   */
  getSystemMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      eventLoop: {
        delay: this.getEventLoopDelay()
      }
    };
  }

  /**
   * 获取事件循环延迟
   */
  getEventLoopDelay() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000;
      this.gauge('event_loop_delay', delay);
    });
    return this.gauges.get('event_loop_delay')?.value || 0;
  }

  /**
   * 重置所有指标
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * 导出Prometheus格式
   */
  exportPrometheus() {
    let output = '';
    
    // 导出计数器
    for (const [key, value] of this.counters) {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n`;
    }
    
    // 导出仪表
    for (const [key, data] of this.gauges) {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${data.value}\n`;
    }
    
    return output;
  }
}

module.exports = new Metrics();


// ==================== src/middleware/metricsCollector.js ====================
const metrics = require('../utils/metrics');

/**
 * 指标收集中间件
 */
class MetricsCollector {
  /**
   * 收集HTTP指标
   */
  static collectHTTPMetrics() {
    return (req, res, next) => {
      const timer = metrics.timer('http_request_duration', {
        method: req.method,
        route: req.route?.path || req.path
      });

      // 增加请求计数
      metrics.increment('http_requests_total', 1, {
        method: req.method,
        route: req.route?.path || req.path
      });

      // 响应结束时记录指标
      res.on('finish', () => {
        const duration = timer.end();
        
        // 记录响应状态
        metrics.increment('http_responses_total', 1, {
          method: req.method,
          route: req.route?.path || req.path,
          status: res.statusCode
        });

        // 记录响应时间
        metrics.histogram('http_response_time', duration, {
          method: req.method,
          status: res.statusCode
        });
      });

      next();
    };
  }

  /**
   * 收集业务指标
   */
  static collectBusinessMetrics() {
    return async (req, res, next) => {
      // 在控制器中使用
      req.metrics = {
        increment: (key, value, labels) => metrics.increment(key, value, labels),
        gauge: (key, value, labels) => metrics.gauge(key, value, labels),
        histogram: (key, value, labels) => metrics.histogram(key, value, labels),
        timer: (key, labels) => metrics.timer(key, labels)
      };

      next();
    };
  }

  /**
   * 指标端点
   */
  static metricsEndpoint() {
    return (req, res) => {
      const format = req.query.format || 'json';
      
      if (format === 'prometheus') {
        res.set('Content-Type', 'text/plain');
        res.send(metrics.exportPrometheus());
      } else {
        res.json(metrics.getMetrics());
      }
    };
  }
}

module.exports = MetricsCollector;


// ==================== src/config/sentry.js ====================
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Sentry错误追踪配置
 */
class SentryConfig {
  static init(app) {
    if (!process.env.SENTRY_DSN) {
      console.warn('⚠️  Sentry DSN未配置，错误追踪功能未启用');
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
        new ProfilingIntegration()
      ],

      // 过滤敏感数据
      beforeSend(event, hint) {
        // 移除敏感信息
        if (event.request) {
          delete event.request.cookies;
          if (event.request.data) {
            const data = event.request.data;
            if (data.password) data.password = '[FILTERED]';
            if (data.token) data.token = '[FILTERED]';
          }
        }
        return event;
      },

      // 忽略的错误
      ignoreErrors: [
        'NetworkError',
        'AbortError',
        /timeout/i
      ]
    });

    // 请求处理器（必须在所有控制器之前）
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    return Sentry;
  }

  /**
   * 错误处理器（必须在所有中间件之后）
   */
  static errorHandler() {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // 只捕获500级别的错误
        return error.status >= 500;
      }
    });
  }

  /**
   * 手动捕获错误
   */
  static captureException(error, context = {}) {
    Sentry.captureException(error, {
      tags: context.tags,
      extra: context.extra,
      user: context.user
    });
  }

  /**
   * 记录消息
   */
  static captureMessage(message, level = 'info') {
    Sentry.captureMessage(message, level);
  }

  /**
   * 设置用户上下文
   */
  static setUser(user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username
    });
  }

  /**
   * 添加面包屑
   */
  static addBreadcrumb(breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

module.exports = SentryConfig;


// ==================== src/utils/healthCheck.js ====================
const { sequelize } = require('../models');
const redis = require('./redis');

/**
 * 健康检查工具
 */
class HealthCheck {
  /**
   * 完整健康检查
   */
  static async check() {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 检查数据库
    checks.checks.database = await this.checkDatabase();

    // 检查Redis
    checks.checks.redis = await this.checkRedis();

    // 检查磁盘空间
    checks.checks.disk = await this.checkDiskSpace();

    // 检查内存
    checks.checks.memory = this.checkMemory();

    // 整体状态
    const allHealthy = Object.values(checks.checks).every(c => c.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'unhealthy';

    return checks;
  }

  /**
   * 检查数据库连接
   */
  static async checkDatabase() {
    try {
      await sequelize.authenticate();
      
      // 执行简单查询测试
      const [results] = await sequelize.query('SELECT 1+1 AS result');
      
      return {
        status: 'healthy',
        responseTime: results ? 'fast' : 'slow',
        connections: sequelize.connectionManager.pool.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 检查Redis连接
   */
  static async checkRedis() {
    try {
      if (!redis) {
        return { status: 'disabled' };
      }

      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * 检查磁盘空间
   */
  static async checkDiskSpace() {
    try {
      const os = require('os');
      const diskusage = require('diskusage');
      
      const path = os.platform() === 'win32' ? 'C:' : '/';
      const info = await diskusage.check(path);
      
      const usedPercent = ((info.total - info.available) / info.total) * 100;
      
      return {
        status: usedPercent < 90 ? 'healthy' : 'warning',
        total: `${Math.round(info.total / 1024 / 1024 / 1024)}GB`,
        available: `${Math.round(info.available / 1024 / 1024 / 1024)}GB`,
        usedPercent: `${Math.round(usedPercent)}%`
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * 检查内存使用
   */
  static checkMemory() {
    const usage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    const systemUsedPercent = ((totalMem - freeMem) / totalMem) * 100;

    return {
      status: heapUsedPercent < 90 ? 'healthy' : 'warning',
      heap: {
        used: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        percent: `${Math.round(heapUsedPercent)}%`
      },
      system: {
        total: `${Math.round(totalMem / 1024 / 1024 / 1024)}GB`,
        free: `${Math.round(freeMem / 1024 / 1024 / 1024)}GB`,
        percent: `${Math.round(systemUsedPercent)}%`
      }
    };
  }

  /**
   * 快速健康检查（仅检查核心服务）
   */
  static async quickCheck() {
    try {
      await sequelize.authenticate();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = HealthCheck;


// ==================== src/controllers/metricsController.js ====================
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