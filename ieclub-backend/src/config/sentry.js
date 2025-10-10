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
      // 返回安全的默认对象，避免undefined错误
      return {
        requestHandler: () => (req, res, next) => next(),
        tracingHandler: () => (req, res, next) => next(),
        errorHandler: () => (err, req, res, next) => next(err)
      };
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