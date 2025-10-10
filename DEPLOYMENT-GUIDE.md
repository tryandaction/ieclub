# 🚀 IEclub 域名部署指南

## 📋 部署前提

你已经成功获得了域名：
- **主域名**: www.ieclub.online
- **裸域名**: ieclub.online

## 🛠️ 部署步骤

### 第一步：环境配置

#### 1. 后端环境变量配置
复制并修改后端环境变量文件：

```bash
cd ieclub-backend
cp .env.example .env
```

编辑 `.env` 文件，修改以下配置：

```bash
# 生产环境
NODE_ENV=production
PORT=5000

# 数据库配置（使用你的云数据库）
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=ieclub_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# JWT密钥（必须修改为强密钥！）
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here

# CORS配置（你的域名）
CORS_ORIGIN=https://www.ieclub.online,https://ieclub.online

# 前端URL（你的域名）
FRONTEND_URL=https://www.ieclub.online

# Redis配置（使用你的云Redis）
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# 百度OCR配置（申请百度OCR服务）
BAIDU_OCR_API_KEY=your-baidu-ocr-api-key
BAIDU_OCR_SECRET_KEY=your-baidu-ocr-secret-key

# Sentry监控（申请Sentry账号）
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### 2. 前端环境变量配置
```bash
cd ../ieclub-frontend
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 生产环境API地址
VITE_API_BASE_URL=https://www.ieclub.online/api/v1

# 应用标题
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛

# 生产环境部署域名
VITE_PUBLIC_URL=https://www.ieclub.online
```

### 第二步：数据库迁移

确保生产数据库已创建并运行数据库迁移：

```bash
cd ieclub-backend
npm run migrate
```

### 第三步：构建前端

```bash
cd ../ieclub-frontend
npm run build
```

### 第四步：部署后端

#### 使用PM2部署（推荐）

```bash
cd ieclub-backend

# 安装PM2（如果还没安装）
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js --env production

# 保存PM2配置（服务器重启后自动启动）
pm2 save
pm2 startup
```

#### 或者使用Docker部署

```bash
# 构建镜像
docker build -t ieclub-backend .

# 运行容器
docker run -d \
  --name ieclub-backend \
  -p 5000:5000 \
  --env-file .env \
  ieclub-backend
```

### 第五步：部署前端

前端有几种部署方式：

#### 方法1：静态文件托管（推荐）

将 `ieclub-frontend/dist` 目录下的所有文件上传到你的静态文件服务器（如Nginx）。

#### 方法2：使用Vercel/Netlify部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 部署到Vercel
vercel --prod
```

#### 方法3：Docker部署

```bash
cd ieclub-frontend

# 构建镜像
docker build -t ieclub-frontend .

# 运行容器
docker run -d \
  --name ieclub-frontend \
  -p 80:80 \
  ieclub-frontend
```

## 🌐 域名配置

### DNS配置

在你的域名服务商处配置DNS：

```
# A记录
@           A     your-server-ip
www         A     your-server-ip

# 或者使用CNAME（如果使用CDN）
www         CNAME your-cdn-domain
```

### SSL证书（HTTPS）

#### 使用Let's Encrypt（免费）

```bash
# 安装certbot
sudo apt install certbot

# 为Nginx生成证书
sudo certbot --nginx -d www.ieclub.online -d ieclub.online

# 自动续期
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

#### 使用阿里云/腾讯云SSL证书

在云服务商控制台申请免费SSL证书，然后配置到你的服务器。

## 🔧 Nginx配置示例

```nginx
# HTTP自动跳转HTTPS
server {
    listen 80;
    server_name www.ieclub.online ieclub.online;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name www.ieclub.online ieclub.online;

    # SSL证书路径
    ssl_certificate /etc/letsencrypt/live/www.ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ieclub.online/privkey.pem;

    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 前端静态文件
    location / {
        root /var/www/ieclub-frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 监控和日志

### 应用监控

1. **健康检查**：
   - 前端：https://www.ieclub.online
   - 后端：https://www.ieclub.online/health
   - API：https://www.ieclub.online/api/v1

2. **日志查看**：
   ```bash
   # PM2日志
   pm2 logs ieclub-backend
   pm2 logs ieclub-frontend

   # 系统日志
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

### 性能监控

- **Sentry监控**：自动收集错误和性能数据
- **PM2监控**：`pm2 monit` 查看CPU、内存使用情况
- **Nginx监控**：访问日志分析请求情况

## 🚨 故障排除

### 常见问题

1. **CORS错误**：
   - 检查后端CORS配置是否包含你的域名
   - 确认环境变量已正确设置

2. **API连接失败**：
   - 检查前端API地址是否正确
   - 确认后端服务正在运行：`pm2 status`

3. **HTTPS证书问题**：
   - 检查证书文件路径是否正确
   - 确认域名解析是否生效

4. **数据库连接失败**：
   - 检查数据库服务是否启动
   - 确认连接信息是否正确

### 调试技巧

```bash
# 检查服务状态
pm2 status
pm2 logs

# 检查端口占用
netstat -tlnp | grep :5000
netstat -tlnp | grep :80

# 检查域名解析
nslookup www.ieclub.online

# 检查证书
curl -I https://www.ieclub.online
```

## 📞 技术支持

部署遇到问题？请：

1. 查看日志文件：`pm2 logs`
2. 检查配置文件语法
3. 确认所有服务正常运行
4. 在GitHub Issues中提交问题

## 🎉 部署成功检查清单

- [ ] 域名能正常访问：https://www.ieclub.online
- [ ] 前端页面正常加载
- [ ] API接口能正常调用：https://www.ieclub.online/api/v1
- [ ] 用户注册和登录功能正常
- [ ] HTTPS证书生效，无安全警告
- [ ] 所有链接都使用HTTPS
- [ ] 监控和日志系统正常工作

恭喜！你已经成功部署IEclub到你的域名。现在任何人都可以通过互联网访问你的应用了！🎊