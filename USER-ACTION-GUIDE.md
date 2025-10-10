# 🎯 IEclub 部署与小程序集成 - 用户行动指南

## ⚠️ 重要提醒

你的代码是由AI生成的，缺少真实的服务凭证和配置信息。本指南将告诉你**所有需要你手动完成的事情**，按顺序执行。

---

## 📋 第一阶段：准备工作（必须完成）

### 1.1 域名和服务器准备

#### ✅ 已完成的域名
你已经有了域名：
- `www.ieclub.online`
- `ieclub.online`

#### 🚨 需要你做的：购买服务器

**推荐方案（阿里云轻量应用服务器）**：
1. 访问 [阿里云官网](https://www.aliyun.com)
2. 搜索"轻量应用服务器"
3. 选择配置：2核4G，40G SSD，3M带宽
4. 购买时长：至少3个月（￥200-300）
5. **地域选择**：华东2（上海）或华南1（深圳）

**替代方案（腾讯云）**：
1. 访问 [腾讯云官网](https://cloud.tencent.com)
2. 购买轻量应用服务器，相同配置

**获取服务器信息**：
- 公网IP地址：`你的服务器IP`
- 登录用户名：`root`
- 初始密码：服务器提供商发送到你的邮箱

### 1.2 申请第三方服务账号

#### 🚨 需要你做的：微信小程序账号
1. 访问 [微信小程序官网](https://mp.weixin.qq.com/)
2. 注册小程序账号（类型：企业/个人）
3. **准备材料**：
   - 营业执照（企业）或身份证（个人）
   - 管理员身份证照片
   - 小程序名称：`IEclub` 或 `南方科技大学论坛`

4. 注册完成后，进入小程序后台，记录：
   - AppID：`wx1234567890`
   - AppSecret：`abcdefghijklmnop`

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

---

## 📝 第二阶段：配置信息填写（关键步骤）

### 2.1 后端环境变量配置

找到文件：`ieclub-backend/.env.example`

**复制并创建配置文件**：
```bash
cd ieclub-backend
cp .env.example .env
```

**需要你填写的配置项**：

```bash
# ========== 数据库配置（重要！） ==========
# 你需要设置强密码，记录下来！
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub_prod
DB_USER=ieclub_user
DB_PASSWORD=你的数据库密码（自己想一个复杂的）

# ========== JWT配置（重要！） ==========
# 必须修改为自己的密钥！
JWT_SECRET=你的超级复杂密钥至少32位字符
JWT_REFRESH_SECRET=另一个不同的复杂密钥至少32位

# ========== 微信小程序配置 ==========
WECHAT_MINIPROGRAM_APPID=你申请的小程序AppID
WECHAT_MINIPROGRAM_SECRET=你申请的小程序AppSecret

# ========== 百度OCR配置 ==========
BAIDU_OCR_API_KEY=你申请的百度API Key
BAIDU_OCR_SECRET_KEY=你申请的百度Secret Key

# ========== Sentry监控 ==========
SENTRY_DSN=你申请的Sentry DSN（可选）

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

---

## 🛠️ 第三阶段：部署执行（按顺序执行）

### 3.1 服务器环境搭建

#### 连接到你的服务器：
```bash
# 替换为你的服务器IP和密码
ssh root@你的服务器IP
# 输入服务器密码
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

## 📋 执行检查清单

### 必须完成的事项：
- [ ] 购买服务器并获取IP地址
- [ ] 申请微信小程序账号并获取AppID
- [ ] 申请百度OCR账号并获取凭证
- [ ] 填写所有配置文件中的密码和密钥
- [ ] 执行完整的部署流程
- [ ] 配置域名解析
- [ ] 配置HTTPS证书
- [ ] 验证网站可以正常访问

### 可选事项：
- [ ] 申请Sentry账号配置监控
- [ ] 开发微信小程序
- [ ] 配置微信支付功能

---

## 🎯 预期成果

完成以上所有步骤后，你将拥有：

1. ✅ **可在线访问的完整论坛**：https://www.ieclub.online
2. ✅ **支持微信小程序登录**：用户可以用微信登录
3. ✅ **OCR文字识别功能**：可以识别图片中的文字
4. ✅ **完整的学生社区功能**：论坛、活动、智能匹配等

---

## ⏰ 时间估算

- **域名和服务器准备**：2-4小时
- **第三方账号申请**：1-2天（小程序审核需要时间）
- **配置信息填写**：30分钟
- **服务器部署**：2-3小时
- **测试验证**：1小时

**总计**：1-3天

---

## 💡 建议执行顺序

1. **今天**：购买服务器，申请小程序和百度OCR账号
2. **明天**：填写所有配置信息，执行部署
3. **后天**：测试验证，开发小程序（如需要）

按照这个指南一步步执行，你就能成功部署IEclub并支持小程序访问！

有任何问题都可以随时问我！🚀