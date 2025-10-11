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
     // 检查Sentry是否已正确初始化
     if (!Sentry.Handlers || !Sentry.Handlers.requestHandler) {
       console.warn('⚠️  Sentry未初始化，返回空中间件');
       return (req, res, next) => next();
     }

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
     // 检查Sentry是否已正确初始化
     if (!Sentry.Handlers || !Sentry.Handlers.tracingHandler) {
       console.warn('⚠️  Sentry未初始化，返回空中间件');
       return (req, res, next) => next();
     }

     return Sentry.Handlers.tracingHandler();
   }

   /**
    * 错误处理中间件
    */
   static errorHandler() {
     // 检查Sentry是否已正确初始化
     if (!Sentry.Handlers || !Sentry.Handlers.errorHandler) {
       console.warn('⚠️  Sentry未初始化，返回空中间件');
       return (err, req, res, next) => next(err);
     }

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
     if (!Sentry.captureException) {
       console.warn('⚠️  Sentry未初始化，跳过异常捕获');
       return;
     }

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
     if (!Sentry.captureMessage) {
       console.warn('⚠️  Sentry未初始化，跳过消息捕获');
       return;
     }

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
     if (!Sentry.setUser) {
       console.warn('⚠️  Sentry未初始化，跳过用户上下文设置');
       return;
     }

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
     if (!Sentry.setUser) {
       console.warn('⚠️  Sentry未初始化，跳过用户上下文清除');
       return;
     }

     Sentry.setUser(null);
   }

   /**
    * 添加面包屑
    */
   static addBreadcrumb(breadcrumb) {
     if (!Sentry.addBreadcrumb) {
       console.warn('⚠️  Sentry未初始化，跳过面包屑添加');
       return;
     }

     Sentry.addBreadcrumb({
       timestamp: Date.now(),
       ...breadcrumb
     });
   }

   /**
    * 性能追踪
    */
   static startTransaction(name, op = 'http.server') {
     if (!Sentry.startTransaction) {
       console.warn('⚠️  Sentry未初始化，返回空事务对象');
       return {
         finish: () => {},
         startChild: () => ({})
       };
     }

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
     if (!transaction || !transaction.startChild) {
       console.warn('⚠️  Sentry未初始化或事务无效，返回空span对象');
       return {
         finish: () => {}
       };
     }

     return transaction.startChild({
       op,
       description: name
     });
   }
}

module.exports = SentryConfig;