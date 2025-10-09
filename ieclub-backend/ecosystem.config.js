// ==================== ecosystem.config.js ====================
// PM2进程管理配置文件（生产环境使用）
// 使用方法：pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      // ========== 应用基本配置 ==========
      name: 'ieclub-api',
      script: './src/server.js',
      
      // ========== 集群模式配置 ==========
      instances: 2,  // 实例数量，可以设置为CPU核心数，或用 'max' 自动检测
      exec_mode: 'cluster', // 集群模式，充分利用多核CPU
      
      // ========== 环境变量 ==========
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      
      // ========== 日志配置 ==========
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // ========== 重启策略 ==========
      autorestart: true,          // 崩溃自动重启
      watch: false,               // 生产环境不监听文件变化
      max_memory_restart: '500M', // 内存超过500M自动重启
      min_uptime: '10s',          // 最小运行时间（防止无限重启）
      max_restarts: 10,           // 最大重启次数
      restart_delay: 4000,        // 重启延迟
      
      // ========== 其他配置 ==========
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // ========== 部署配置（可选） ==========
  deploy: {
    production: {
      user: 'root',
      host: '你的服务器IP',
      ref: 'origin/main',
      repo: 'git@github.com:你的用户名/ieclub-backend.git',
      path: '/var/www/ieclub-backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

/* ============================================================
   PM2 常用命令：
   
   启动应用：
   pm2 start ecosystem.config.js --env production
   
   查看状态：
   pm2 status
   pm2 list
   
   查看日志：
   pm2 logs ieclub-api
   pm2 logs ieclub-api --lines 100
   
   监控：
   pm2 monit
   
   重启：
   pm2 restart ieclub-api
   pm2 reload ieclub-api  # 0秒停机重启
   
   停止：
   pm2 stop ieclub-api
   
   删除：
   pm2 delete ieclub-api
   
   保存配置：
   pm2 save
   
   开机自启：
   pm2 startup
   pm2 save
   
   更新PM2：
   pm2 update
============================================================ */