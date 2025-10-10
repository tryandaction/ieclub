

#### 🚨 需要你做的：百度OCR账号（用于图片文字识别）
1. 访问 [百度AI开放平台](https://ai.baidu.com/)
2. 注册登录百度账号
3. 创建应用，选择"文字识别"
4. 获取凭证：
   - API Key：`你的API Key`
   - Secret Key：`你的Secret Key`

#### 🚨 需要你做的：Sentry监控账号（可选，用于错误追踪）
1. 访问 [Sentry官网](https://sentry.io/)
2. 注册账号，选择免费套餐
3. 创建项目，获取DSN：`https://xxx@sentry.io/xxx`


# ========== 邮箱配置（暂时用不到） ==========
SMTP_HOST=smtp.qq.com
SMTP_USER=你的邮箱@qq.com
SMTP_PASSWORD=你的邮箱授权码
```

### 2.2 前端环境变量配置

找到文件：`ieclub-frontend/.env.example`

**复制并创建配置文件**：
```bash
cd ../ieclub-frontend
cp .env.example .env
```

**需要你填写的配置项**：
```bash
# API地址（你的域名）
VITE_API_BASE_URL=https://www.ieclub.online/api/v1

# 应用标题
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛

# 部署域名
VITE_PUBLIC_URL=https://www.ieclub.online
```

```

#### 在服务器上执行以下命令：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y

# 安装Certbot（HTTPS证书）
sudo apt install certbot python3-certbot-nginx -y

# 安装Redis
sudo apt install redis-server -y

# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 开放防火墙端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable
```

### 3.2 数据库初始化

```bash
# 连接PostgreSQL
sudo -u postgres psql

# 在PostgreSQL中执行：
CREATE DATABASE ieclub_prod;
CREATE USER ieclub_user WITH PASSWORD '你的数据库密码';
GRANT ALL PRIVILEGES ON DATABASE ieclub_prod TO ieclub_user;
ALTER USER ieclub_user CREATEDB;
\q
```

### 3.3 上传项目文件

**方法1：使用git克隆（推荐）**
```bash
cd ~
git clone https://github.com/yourusername/ieclub.git
cd ieclub
```

**方法2：压缩包上传**
```bash
# 在本地压缩项目
tar -czf ieclub.tar.gz ieclub/

# 上传到服务器（使用scp或FTP工具）
scp ieclub.tar.gz root@你的服务器IP:~/

# 在服务器解压
cd ~
tar -xzf ieclub.tar.gz
```

### 3.4 后端部署

```bash
cd ~/ieclub/ieclub-backend

# 安装依赖
npm install

# 运行数据库迁移
npm run migrate

# 使用PM2启动
pm2 start src/server.js --name "ieclub-backend" --env production

# 设置开机自启
pm2 startup
pm2 save

# 验证后端运行
curl http://localhost:5000/health
```

### 3.5 前端部署

```bash
cd ~/ieclub/ieclub-frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 创建网站目录
sudo mkdir -p /var/www/ieclub

# 复制构建文件
sudo cp -r dist/* /var/www/ieclub/

# 设置权限
sudo chown -R www-data:www-data /var/www/ieclub
```

### 3.6 Nginx配置

```bash
# 编辑Nginx配置
sudo nano /etc/nginx/sites-available/ieclub
```

**复制以下配置**：
```nginx
server {
    listen 80;
    server_name www.ieclub.online ieclub.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.ieclub.online ieclub.online;

    # 前端静态文件
    location / {
        root /var/www/ieclub;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.7 HTTPS证书配置

```bash
# 生成免费SSL证书
sudo certbot --nginx -d www.ieclub.online -d ieclub.online

# 设置自动续期
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

### 3.8 域名解析配置

在你的域名服务商后台：
1. 添加A记录：
   - 主机记录：`www`
   - 记录值：`你的服务器IP`
   - TTL：600

2. 添加A记录：
   - 主机记录：`@`
   - 记录值：`你的服务器IP`
   - TTL：600

**验证域名解析**：
```bash
nslookup www.ieclub.online
nslookup ieclub.online
```

---

## 📱 第四阶段：小程序开发（可选）

### 4.1 小程序合法域名配置

在微信小程序后台：
1. 进入「开发」-「开发管理」-「开发设置」
2. 在「服务器域名」中添加：
   - request合法域名：`https://www.ieclub.online`
   - uploadFile合法域名：`https://www.ieclub.online`
   - downloadFile合法域名：`https://www.ieclub.online`

### 4.2 小程序项目开发

1. **导入小程序项目**：
   - 使用微信开发者工具
   - 导入 `miniprogram-template` 目录
   - 填入你的小程序AppID

2. **修改小程序配置**：
   编辑 `miniprogram-template/app.json`：
   ```json
   {
     "pages": [
       "pages/index/index",
       "pages/login/login"
     ]
   }
   ```

3. **测试小程序登录**：
   - 在微信开发者工具中测试
   - 确保能正常调用后端接口

---

## 🔍 第五阶段：验证和测试

### 5.1 网站访问测试

访问以下地址确认部署成功：

- ✅ **主站**：https://www.ieclub.online
- ✅ **API文档**：https://www.ieclub.online/api/v1
- ✅ **健康检查**：https://www.ieclub.online/health

### 5.2 功能测试

1. **用户注册和登录**
2. **帖子发布和浏览**
3. **活动查看**
4. **OCR功能测试**

### 5.3 小程序测试（如果开发）

1. **微信登录功能**
2. **数据加载**
3. **界面交互**

---

## 🚨 常见问题解决

### 问题1：域名无法访问
```bash
# 检查域名解析
nslookup www.ieclub.online

# 检查服务器端口
netstat -tlnp | grep :80

# 检查Nginx状态
sudo systemctl status nginx
```

### 问题2：数据库连接失败
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 检查数据库连接
psql -h localhost -U ieclub_user -d ieclub_prod
```

### 问题3：小程序登录失败
- 检查小程序AppID和Secret配置
- 确认后端微信登录接口正常
- 检查小程序合法域名配置

---
