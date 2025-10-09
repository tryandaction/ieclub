const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// 数据库连接和服务器启动
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('✅ 数据库连接成功');
    
    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ 数据库模型同步完成');
    }
    
    // 启动服务器
    const server = app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在端口 ${PORT}`);
      logger.info(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 健康检查: http://localhost:${PORT}/health`);
      logger.info(`📡 API地址: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });

    // 优雅关闭
    const gracefulShutdown = async (signal) => {
      logger.info(`\n收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('HTTP服务器已关闭');
        
        try {
          await sequelize.close();
          logger.info('数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          logger.error('关闭数据库连接时出错:', error);
          process.exit(1);
        }
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('无法优雅关闭，强制退出');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();