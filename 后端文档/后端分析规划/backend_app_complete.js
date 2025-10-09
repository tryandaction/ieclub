const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// 导入路由和中间件
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// ==================== 安全中间件 ====================
// Helmet：设置安全HTTP头
app.use(helmet({
  contentSecurityPolicy: false, // 开发环境可以关闭，生产环境建议配置
  crossOriginEmbedderPolicy: false
}));

/* 生产环境建议配置：
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
*/


// ==================== CORS配置 ====================
// 开发环境：允许本地前端访问
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']
    : process.env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

/* 生产环境（有域名后）配置：
const corsOptions = {
  origin: [
    'https://www.ieclub.com',           // 前端主域名
    'https://ieclub.com',               // 不带www
    'https://admin.ieclub.com'          // 管理后台（如果有）
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
*/


// ==================== 请求体解析 ====================
app.use(express.json({ limit: '10mb' })); // JSON解析，限制10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析


// ==================== 响应压缩 ====================
app.use(compression()); // Gzip压缩


// ==================== 日志中间件 ====================
if (process.env.NODE_ENV === 'development') {
  // 开发环境：彩色输出到控制台
  app.use(morgan('dev'));
} else {
  // 生产环境：写入日志文件
  app.use(morgan('combined', { 
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400 // 只记录错误请求
  }));
}


// ==================== 静态文件服务 ====================
// 开发环境：提供本地上传文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* 生产环境（有OSS后）：
// 不需要静态文件服务，所有文件都在OSS上
// 如果需要缓存一些文件，可以保留：
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '30d', // 缓存30天
  etag: true
}));
*/


// ==================== 信任代理 ====================
// 生产环境（Nginx反向代理后）需要启用
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/* 说明：
当使用Nginx反向代理时，需要信任代理以获取真实IP地址
Nginx配置中需要设置：
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
*/


// ==================== 限流中间件 ====================
// 开发环境：不启用限流
if (process.env.NODE_ENV === 'production') {
  app.use('/api', generalLimiter);
}

/* 开发环境不限流，方便测试
生产环境启用限流：
- 通用API：15分钟100次
- 认证API：15分钟5次
- 上传API：15分钟20次
*/


// ==================== 健康检查接口 ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  });
});

/* 生产环境可以添加更详细的健康检查：
app.get('/health', async (req, res) => {
  const { sequelize } = require('./models');
  
  try {
    await sequelize.authenticate();
    
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});
*/


// ==================== API路由 ====================
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}`, routes);

/* 如果需要支持多个API版本：
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));
*/


// ==================== 根路由 ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IEclub API',
    version: apiVersion,
    documentation: '/api-docs', // 如果有API文档
    endpoints: {
      health: '/health',
      api: `/api/${apiVersion}`
    },
    environment: process.env.NODE_ENV || 'development'
  });
});


// ==================== 404处理 ====================
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});


// ==================== 全局错误处理中间件 ====================
app.use(errorHandler);


// ==================== 开发环境调试信息 ====================
if (process.env.NODE_ENV === 'development') {
  // 打印所有注册的路由（调试用）
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`Route: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    }
  });
}


// ==================== 导出应用 ====================
module.exports = app;


/* ============================================================
   生产环境部署注意事项（有服务器和域名后）：
   ============================================================

   1. 环境变量配置：
   
   NODE_ENV=production
   PORT=5000
   
   # 数据库（阿里云RDS或自建）
   DB_HOST=rm-xxx.mysql.rds.aliyuncs.com
   DB_PORT=3306
   DB_NAME=ieclub_prod
   DB_USER=ieclub
   DB_PASSWORD=强密码
   
   # CORS配置（使用实际域名）
   CORS_ORIGIN=https://www.ieclub.com,https://ieclub.com
   
   # JWT密钥（必须更换为强密钥）
   JWT_SECRET=生产环境超长超复杂的随机字符串
   
   # 文件存储（阿里云OSS）
   ALI_OSS_REGION=oss-cn-shenzhen
   ALI_OSS_ACCESS_KEY_ID=你的AccessKeyId
   ALI_OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
   ALI_OSS_BUCKET=ieclub-files
   
   # 前端URL（实际域名）
   FRONTEND_URL=https://www.ieclub.com

   
   2. Nginx反向代理配置：
   
   server {
       listen 80;
       server_name api.ieclub.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name api.ieclub.com;
       
       ssl_certificate /etc/letsencrypt/live/api.ieclub.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.ieclub.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }

   
   3. PM2进程管理：
   
   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'ieclub-api',
       script: './src/server.js',
       instances: 2,  // 根据CPU核心数调整
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: './logs/pm2-error.log',
       out_file: './logs/pm2-out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss',
       merge_logs: true,
       autorestart: true,
       watch: false,
       max_memory_restart: '500M'
     }]
   }
   
   # 启动命令
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup

   
   4. 安全加固：
   
   - 启用HTTPS（Let's Encrypt免费证书）
   - 配置防火墙（只开放80/443端口）
   - 定期更新依赖包（npm audit）
   - 启用日志监控和告警
   - 配置备份策略（数据库每日备份）
   - 设置Redis密码保护
   - 使用环境变量存储敏感信息
   
   
   5. 性能优化：
   
   - 启用Redis缓存热门数据
   - 配置CDN加速静态资源
   - 数据库查询优化和索引
   - 启用Gzip压缩
   - 配置图片CDN（阿里云OSS + CDN）
   
   
   6. 监控告警：
   
   - PM2监控：pm2 monit
   - 阿里云监控：CPU、内存、磁盘使用率
   - 日志分析：ELK Stack（可选）
   - 错误追踪：Sentry（可选）
   
============================================================ */
