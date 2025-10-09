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


// ==================== nginx.conf ====================
/* 
Nginx配置文件：/etc/nginx/sites-available/ieclub
创建软链接：sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/

# ========== HTTP自动跳转HTTPS ==========
server {
    listen 80;
    listen [::]:80;
    server_name api.ieclub.com;  # 替换为你的API域名
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# ========== HTTPS主配置 ==========
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.ieclub.com;  # 替换为你的API域名
    
    # ========== SSL证书配置 ==========
    # Let's Encrypt免费证书路径
    ssl_certificate /etc/letsencrypt/live/api.ieclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ieclub.com/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # ========== 安全头 ==========
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # ========== 日志配置 ==========
    access_log /var/log/nginx/ieclub-api-access.log;
    error_log /var/log/nginx/ieclub-api-error.log;
    
    # ========== 反向代理配置 ==========
    location / {
        # 代理到Node.js应用
        proxy_pass http://localhost:5000;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # 重要：传递真实客户端信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 缓存配置
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # ========== 文件上传大小限制 ==========
    client_max_body_size 10M;
    
    # ========== Gzip压缩 ==========
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
}

# ========== 前端配置（如果前端也部署在同一服务器） ==========
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.ieclub.com ieclub.com;  # 前端域名
    
    ssl_certificate /etc/letsencrypt/live/www.ieclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ieclub.com/privkey.pem;
    
    root /var/www/ieclub-frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
}

============================================================
Nginx 常用命令：

测试配置：
sudo nginx -t

重启Nginx：
sudo systemctl restart nginx

重载配置（无停机）：
sudo systemctl reload nginx

查看状态：
sudo systemctl status nginx

查看日志：
sudo tail -f /var/log/nginx/ieclub-api-access.log
sudo tail -f /var/log/nginx/ieclub-api-error.log

SSL证书申请（Let's Encrypt）：
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.ieclub.com
sudo certbot renew --dry-run  # 测试自动续期
============================================================
*/


// ==================== .env.production ====================
/*
生产环境环境变量配置文件（有域名服务器后使用）

# ========== 服务器配置 ==========
NODE_ENV=production
PORT=5000
API_VERSION=v1

# ========== 数据库配置 ==========
DB_HOST=你的数据库地址  # 如：rm-xxx.mysql.rds.aliyuncs.com
DB_PORT=5432
DB_NAME=ieclub_prod
DB_USER=ieclub_user
DB_PASSWORD=超强密码123!@#
DB_POOL_MAX=50
DB_POOL_MIN=5

# ========== JWT配置（必须更换） ==========
JWT_SECRET=生产环境超长超复杂的随机字符串abcdefg123456!@#$%^&*
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=另一个超长的随机字符串xyz789!@#
JWT_REFRESH_EXPIRES_IN=30d

# ========== CORS配置（使用实际域名） ==========
CORS_ORIGIN=https://www.ieclub.com,https://ieclub.com

# ========== 邮箱配置 ==========
SMTP_HOST=smtp.exmail.qq.com  # 企业邮箱
SMTP_PORT=465
SMTP_USER=noreply@ieclub.com
SMTP_PASSWORD=邮箱密码
EMAIL_FROM=IEclub <noreply@ieclub.com>

# ========== 允许的邮箱域名 ==========
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn

# ========== 阿里云OSS配置 ==========
ALI_OSS_REGION=oss-cn-shenzhen
ALI_OSS_ACCESS_KEY_ID=你的AccessKeyId
ALI_OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
ALI_OSS_BUCKET=ieclub-files
ALI_OSS_ENDPOINT=https://ieclub-files.oss-cn-shenzhen.aliyuncs.com

# ========== 百度OCR配置 ==========
OCR_PROVIDER=baidu
BAIDU_OCR_APP_ID=你的AppId
BAIDU_OCR_API_KEY=你的ApiKey
BAIDU_OCR_SECRET_KEY=你的SecretKey

# ========== Redis配置 ==========
REDIS_HOST=你的Redis地址  # 如：r-xxx.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=Redis密码
REDIS_DB=0

# ========== 日志配置 ==========
LOG_LEVEL=info
LOG_FILE_PATH=/var/www/ieclub-backend/logs

# ========== 限流配置 ==========
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW=15
AUTH_RATE_LIMIT_MAX=5

# ========== 前端URL（实际域名） ==========
FRONTEND_URL=https://www.ieclub.com

# ========== 文件上传配置 ==========
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
*/


// ==================== 部署检查清单 ====================
/*
□ 购买域名（如：ieclub.com）
□ 购买服务器（阿里云ECS 2核4G起）
□ 配置域名解析（A记录指向服务器IP）
  - www.ieclub.com -> 服务器IP
  - api.ieclub.com -> 服务器IP
  
□ 服务器环境安装
  - Node.js 18+
  - PostgreSQL 13+
  - Nginx
  - PM2
  - Git
  
□ 数据库设置
  - 创建生产数据库
  - 配置用户权限
  - 设置强密码
  
□ 代码部署
  - git clone 到服务器
  - npm install --production
  - 配置 .env.production
  - pm2 start
  
□ Nginx配置
  - 配置反向代理
  - 申请SSL证书
  - 启用HTTPS
  
□ 阿里云服务配置
  - 开通OSS（对象存储）
  - 配置OSS Bucket权限
  - 申请百度OCR
  - 开通Redis（可选）
  
□ 安全配置
  - 配置防火墙（只开80/443）
  - 启用SSL/TLS
  - 配置安全组
  - 设置备份策略
  
□ 监控告警
  - 配置PM2监控
  - 配置阿里云监控
  - 设置告警通知
  
□ 性能优化
  - 启用Gzip压缩
  - 配置CDN（可选）
  - Redis缓存
  - 数据库索引优化

□ 测试验证
  - API接口测试
  - 压力测试
  - 安全测试
  - 备份恢复测试
*/
