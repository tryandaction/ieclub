
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
