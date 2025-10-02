# IEclub 阿里云部署完整指南

## 🏗️ 服务器架构

```
域名: ieclub.sustech.edu.cn
     ↓
阿里云CDN (全球加速)
     ↓
负载均衡 SLB (可选)
     ↓
阿里云ECS服务器
  ├─ Nginx (反向代理 + SSL)
  ├─ 前端静态文件 (dist/)
  ├─ 后端API (Node.js + PM2)
  ├─ PostgreSQL (数据库)
  └─ Redis (缓存)
     
外部服务:
  ├─ 阿里云OSS (文件存储)
  ├─ 阿里云CDN (静态资源加速)
  ├─ 百度OCR API (文字识别)
  └─ 阿里云邮件推送 (通知)
```

## 📋 准备工作

### 1. 购买阿里云服务

#### ECS云服务器
- **推荐配置**: 
  - 实例规格: ecs.t6-c1m2.large (2核4GB)
  - 系统盘: 40GB SSD
  - 带宽: 5Mbps
  - 操作系统: Ubuntu 22.04 LTS
  - 地域: 深圳/广州（靠近南科大）

#### OSS对象存储
- **Bucket配置**:
  - 名称: ieclub-files
  - 地域: 华南1（深圳）
  - 读写权限: 公共读
  - 存储类型: 标准存储

#### CDN加速
- 加速域名: cdn.ieclub.sustech.edu.cn
- 源站: OSS Bucket

#### 域名
- 主域名: ieclub.sustech.edu.cn
- API域名: api.ieclub.sustech.edu.cn (可选)

### 2. 域名配置

#### 在阿里云控制台添加域名解析
```
记录类型    主机记录    解析线路    记录值              TTL
A          @          默认       你的ECS公网IP       10分钟
A          www        默认       你的ECS公网IP       10分钟
CNAME      cdn        默认       CDN加速域名         10分钟
```

#### 申请SSL证书（免费）
1. 在阿里云SSL证书服务申请免费证书
2. 域名验证通过后下载证书
3. 上传到服务器 `/etc/nginx/ssl/`

## 🖥️ 服务器环境搭建

### 1. 连接服务器
```bash
ssh root@你的服务器IP
```

### 2. 更新系统
```bash
apt update && apt upgrade -y
```

### 3. 安装Node.js
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v
npm -v
```

### 4. 安装PostgreSQL
```bash
# 安装
sudo apt install postgresql postgresql-contrib -y

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql

# 在PostgreSQL命令行中执行:
CREATE DATABASE ieclub;
CREATE USER ieclub_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ieclub TO ieclub_user;
\q

# 配置远程访问（可选）
sudo vim /etc/postgresql/14/main/postgresql.conf
# 修改: listen_addresses = 'localhost'

sudo vim /etc/postgresql/14/main/pg_hba.conf
# 添加: host all all 127.0.0.1/32 md5

# 重启PostgreSQL
sudo systemctl restart postgresql
```

### 5. 安装Redis
```bash
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# 测试Redis
redis-cli ping
# 应该返回 PONG
```

### 6. 安装Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7. 安装PM2（Node.js进程管理）
```bash
npm install -g pm2
```

### 8. 安装Git
```bash
sudo apt install git -y
```

## 📦 部署后端

### 1. 克隆代码
```bash
cd /var/www
git clone https://github.com/your-username/ieclub-backend.git
cd ieclub-backend
```

### 2. 安装依赖
```bash
npm install --production
```

### 3. 配置环境变量
```bash
cp .env.example .env
vim .env
```

编辑.env文件：
```bash
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub
DB_USER=ieclub_user
DB_PASSWORD=your_secure_password
JWT_SECRET=生成一个强密码
# ... 其他配置
```

### 4. 数据库迁移
```bash
npm run migrate
npm run seed  # 可选：填充初始数据
```

### 5. 使用PM2启动
```bash
pm2 start src/server.js --name ieclub-api
pm2 save
pm2 startup
```

### 6. 查看日志
```bash
pm2 logs ieclub-api
pm2 monit
```

## 🎨 部署前端

### 1. 本地构建（在开发机器上）
```bash
cd ieclub-frontend

# 配置生产环境变量
vim .env.production
```

.env.production内容：
```bash
VITE_API_BASE_URL=https://ieclub.sustech.edu.cn/api/v1
VITE_APP_NAME=IEclub
```

```bash
# 构建
npm run build

# 上传dist目录到服务器
scp -r dist root@服务器IP:/var/www/ieclub-frontend/
```

### 2. 服务器配置
```bash
# 在服务器上
mkdir -p /var/www/ieclub-frontend
# 将dist目录内容放到这里
```

## ⚙️ Nginx配置

### 创建Nginx配置文件
```bash
sudo vim /etc/nginx/sites-available/ieclub
```

完整配置：
```nginx
# 限流配置
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=3r/m;

# HTTP重定向到HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ieclub.sustech.edu.cn www.ieclub.sustech.edu.cn;
    
    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 重定向到HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS主配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ieclub.sustech.edu.cn www.ieclub.sustech.edu.cn;

    # SSL证书配置
    ssl_certificate /etc/nginx/ssl/ieclub.sustech.edu.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/ieclub.sustech.edu.cn.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 现代SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # 前端静态文件
    root /var/www/ieclub-frontend/dist;
    index index.html;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API代理
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 登录接口特殊限流
    location /api/v1/auth/login {
        limit_req zone=login_limit burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 日志
    access_log /var/log/nginx/ieclub_access.log;
    error_log /var/log/nginx/ieclub_error.log;
}
```

### 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 🔒 SSL证书（Let's Encrypt）

### 使用Certbot自动获取免费SSL证书
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d ieclub.sustech.edu.cn -d www.ieclub.sustech.edu.cn

# 自动续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

## 🔥 防火墙配置

```bash
# 安装UFW
sudo apt install ufw -y

# 配置规则
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS

# 启用防火墙
sudo ufw enable
sudo ufw status
```

## 📊 监控和日志

### 1. PM2监控
```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs ieclub-api --lines 100

# 查看状态
pm2 status
```

### 2. Nginx日志
```bash
# 访问日志
tail -f /var/log/nginx/ieclub_access.log

# 错误日志
tail -f /var/log/nginx/ieclub_error.log
```

### 3. 系统监控
```bash
# 安装htop
sudo apt install htop -y
htop

# 查看磁盘使用
df -h

# 查看内存
free -h
```

## 🚀 CI/CD自动部署（可选）

### GitHub Actions配置
在前端项目创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Aliyun

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        source: "dist/*"
        target: "/var/www/ieclub-frontend/"
        strip_components: 1
```

## 🔄 数据库备份

### 自动备份脚本
```bash
# 创建备份脚本
vim /root/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ieclub"
DB_USER="ieclub_user"

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/ieclub_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "ieclub_*.sql.gz" -mtime +7 -delete

echo "备份完成: ieclub_$DATE.sql.gz"
```

```bash
# 添加执行权限
chmod +x /root/backup_db.sh

# 添加定时任务（每天凌晨3点）
crontab -e
# 添加：0 3 * * * /root/backup_db.sh
```

## 📱 小程序部署准备

### 后端API适配
在后端添加小程序登录接口：

```javascript
// src/controllers/authController.js
exports.wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    // 1. 通过code换取openid和session_key
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { openid, session_key } = wxResponse.data;
    
    // 2. 查找或创建用户
    let user = await User.findOne({ where: { wechatOpenid: openid } });
    
    if (!user) {
      // 新用户，返回需要绑定邮箱
      return res.json({
        code: 200,
        message: '需要绑定邮箱',
        data: {
          needBind: true,
          openid: openid
        }
      });
    }
    
    // 3. 生成token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.bindEmail = async (req, res, next) => {
  try {
    const { openid, email, password, username } = req.body;
    
    // 验证邮箱
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        message: '请使用南科大邮箱'
      });
    }
    
    // 创建用户
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      passwordHash,
      wechatOpenid: openid,
      school: '南方科技大学'
    });
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      code: 200,
      message: '绑定成功',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### 在User模型添加字段
```javascript
wechatOpenid: {
  type: DataTypes.STRING(100),
  unique: true,
  field: 'wechat_openid'
}
```

## 🎯 性能优化

### 1. 启用HTTP/2
已在Nginx配置中启用

### 2. 数据库连接池
已在Sequelize配置中设置

### 3. Redis缓存
```javascript
// src/services/cacheService.js
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB
});

exports.get = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

exports.set = async (key, value, expireSeconds = 3600) => {
  await redis.setex(key, expireSeconds, JSON.stringify(value));
};

exports.del = async (key) => {
  await redis.del(key);
};
```

### 4. CDN加速
在阿里云CDN控制台配置：
- 源站：OSS Bucket
- 缓存规则：
  - 图片：缓存30天
  - JS/CSS：缓存7天
  - HTML：不缓存

## ✅ 部署检查清单

### 部署前
- [ ] 代码已提交到Git
- [ ] 环境变量已配置
- [ ] 数据库已创建
- [ ] SSL证书已申请
- [ ] 域名已解析

### 部署中
- [ ] 服务器环境已搭建
- [ ] 后端已部署并运行
- [ ] 前端已构建并部署
- [ ] Nginx配置正确
- [ ] SSL证书已配置

### 部署后
- [ ] 网站可以访问
- [ ] HTTPS正常工作
- [ ] API接口正常
- [ ] 数据库连接正常
- [ ] 文件上传正常
- [ ] 日志记录正常
- [ ] 备份脚本已配置
- [ ] 监控已启用

## 🐛 常见问题排查

### 1. Nginx 502 Bad Gateway
```bash
# 检查后端是否运行
pm2 status

# 检查端口是否正确
netstat -tulpn | grep 5000

# 查看Nginx错误日志
tail -f /var/log/nginx/ieclub_error.log
```

### 2. 数据库连接失败
```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 测试连接
psql -U ieclub_user -h localhost -d ieclub
```

### 3. 前端页面空白
```bash
# 检查dist目录是否存在
ls -la /var/www/ieclub-frontend/dist/

# 检查Nginx配置
sudo nginx -t

# 查看浏览器控制台错误
```

## 📞 支持与维护

### 定期维护任务
- **每周**: 检查日志、更新依赖
- **每月**: 数据库优化、备份验证
- **每季度**: 安全审计、性能优化

### 监控告警
建议使用阿里云云监控设置告警：
- CPU使用率 > 80%
- 内存使用率 > 85%
- 磁盘使用率 > 80%
- 网络流量异常

---

**部署完成后，你的IEclub将运行在：https://ieclub.sustech.edu.cn** 🎉