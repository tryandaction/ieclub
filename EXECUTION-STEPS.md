# 📋 IEclub 部署执行步骤清单

## ⚠️ 重要提醒

**请严格按照以下顺序执行，每完成一步打勾确认。**

---

## 🎯 第一天：准备阶段（账号申请和服务购买）

### 步骤1：购买服务器 ✅
- [ ] 访问阿里云官网：https://www.aliyun.com
- [ ] 搜索"轻量应用服务器"
- [ ] 选择配置：2核4G，40G SSD，3M带宽
- [ ] 购买3个月（约￥200-300）
- [ ] **记录服务器IP**：______________________
- [ ] **记录登录密码**：______________________

### 步骤2：申请微信小程序账号
- [ ] 访问：https://mp.weixin.qq.com/
- [ ] 注册小程序账号（选择企业或个人）
- [ ] 上传营业执照或身份证照片
- [ ] 等待审核通过（1-3天）
- [ ] **记录AppID**：______________________
- [ ] **记录AppSecret**：______________________

### 步骤3：申请百度OCR服务
- [ ] 访问：https://ai.baidu.com/
- [ ] 注册百度账号并登录
- [ ] 进入文字识别服务
- [ ] 创建应用获取凭证
- [ ] **记录API Key**：______________________
- [ ] **记录Secret Key**：______________________

### 步骤4：域名解析配置
- [ ] 登录你的域名服务商后台
- [ ] 添加A记录：
  - 主机记录：`www`，记录值：你的服务器IP
  - 主机记录：`@`，记录值：你的服务器IP
- [ ] 等待DNS生效（5-30分钟）
- [ ] 验证：`nslookup www.ieclub.online`

---

## 🎯 第二天：配置阶段（填写所有配置信息）

### 步骤5：配置后端环境变量
```bash
cd ieclub-backend
cp .env.example .env
nano .env
```

**必须填写的配置**：
```bash
# 数据库配置
DB_PASSWORD=你的数据库密码（步骤1中设置的）

# JWT密钥（自己想两个复杂的）
JWT_SECRET=你的主密钥至少32位
JWT_REFRESH_SECRET=你的刷新密钥至少32位

# 微信小程序（步骤2中获取的）
WECHAT_MINIPROGRAM_APPID=你的小程序AppID
WECHAT_MINIPROGRAM_SECRET=你的小程序AppSecret

# 百度OCR（步骤3中获取的）
BAIDU_OCR_API_KEY=你的百度API Key
BAIDU_OCR_SECRET_KEY=你的百度Secret Key
```

### 步骤6：配置前端环境变量
```bash
cd ../ieclub-frontend
cp .env.example .env
nano .env
```

**填写内容**：
```bash
VITE_API_BASE_URL=https://www.ieclub.online/api/v1
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛
VITE_PUBLIC_URL=https://www.ieclub.online
```

---

## 🎯 第三天：部署阶段（服务器操作）

### 步骤7：连接服务器并安装软件
```bash
# 替换为你的服务器IP和密码
ssh root@你的服务器IP

# 粘贴以下命令逐个执行：
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
sudo apt install nginx -y
sudo apt install certbot python3-certbot-nginx -y
sudo apt install redis-server -y
sudo apt install postgresql postgresql-contrib -y

sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable
```

### 步骤8：配置数据库
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

### 步骤9：上传项目文件
**选择以下任一方法**：

**方法A：Git克隆**
```bash
cd ~
git clone https://github.com/yourusername/ieclub.git
```

**方法B：压缩包上传**
```bash
# 在本地执行：
tar -czf ieclub.tar.gz ieclub/

# 使用FTP或scp上传到服务器：
scp ieclub.tar.gz root@你的服务器IP:~/

# 在服务器解压：
cd ~
tar -xzf ieclub.tar.gz
```

### 步骤10：部署后端
```bash
cd ~/ieclub/ieclub-backend
npm install
npm run migrate

pm2 start src/server.js --name "ieclub-backend" --env production
pm2 startup
pm2 save

# 验证后端
curl http://localhost:5000/health
```

### 步骤11：部署前端
```bash
cd ~/ieclub/ieclub-frontend
npm install
npm run build

sudo mkdir -p /var/www/ieclub
sudo cp -r dist/* /var/www/ieclub/
sudo chown -R www-data:www-data /var/www/ieclub
```

### 步骤12：配置Nginx
```bash
sudo nano /etc/nginx/sites-available/ieclub
```

**复制以下完整配置**：
```nginx
server {
    listen 80;
    server_name www.ieclub.online ieclub.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.ieclub.online ieclub.online;

    location / {
        root /var/www/ieclub;
        try_files $uri $uri/ /index.html;
    }

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
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤13：配置HTTPS证书
```bash
sudo certbot --nginx -d www.ieclub.online -d ieclub.online
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

---

## 🎯 第四天：验证和测试

### 步骤14：验证部署结果

**访问测试**：
- [ ] https://www.ieclub.online （主站）
- [ ] https://www.ieclub.online/api/v1 （API）
- [ ] https://www.ieclub.online/health （健康检查）

**功能测试**：
- [ ] 用户注册和登录
- [ ] 帖子发布和浏览
- [ ] 活动查看
- [ ] OCR功能（如果配置了百度OCR）

### 步骤15：小程序配置（可选）

**在微信小程序后台**：
- [ ] 添加服务器域名：https://www.ieclub.online
- [ ] 导入小程序项目代码
- [ ] 测试小程序登录功能

---

## 🚨 故障排除步骤

### 如果网站无法访问：
```bash
# 检查域名解析
nslookup www.ieclub.online

# 检查服务器端口
netstat -tlnp | grep :80

# 检查服务状态
sudo systemctl status nginx
pm2 status

# 查看日志
pm2 logs ieclub-backend
sudo tail -f /var/log/nginx/error.log
```

### 如果数据库连接失败：
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U ieclub_user -d ieclub_prod
```

### 如果小程序登录失败：
- [ ] 检查小程序AppID和Secret配置
- [ ] 确认后端微信登录接口正常
- [ ] 检查小程序合法域名配置

---

## 📊 进度跟踪

### 第一天完成情况：
- [ ] 服务器购买
- [ ] 微信小程序账号申请
- [ ] 百度OCR账号申请
- [ ] 域名解析配置

### 第二天完成情况：
- [ ] 后端环境变量配置
- [ ] 前端环境变量配置

### 第三天完成情况：
- [ ] 服务器环境搭建
- [ ] 数据库初始化
- [ ] 项目文件上传
- [ ] 后端部署
- [ ] 前端部署
- [ ] Nginx配置
- [ ] HTTPS证书配置

### 第四天完成情况：
- [ ] 网站访问验证
- [ ] 功能测试
- [ ] 小程序配置（可选）

---

## 🎉 完成标志

当你能成功完成以下操作时，部署就成功了：

1. ✅ 打开浏览器，访问 https://www.ieclub.online 能看到网站
2. ✅ 能成功注册和登录账号
3. ✅ 能发布和浏览帖子
4. ✅ 所有链接都使用HTTPS且证书有效
5. ✅ API接口正常工作

---

## 💡 小贴士

1. **遇到问题不要慌**：每个步骤都有对应的故障排除方法
2. **仔细检查配置**：大多数问题都是配置填写错误
3. **按顺序执行**：不要跳过任何步骤
4. **保存重要信息**：将所有密码和密钥记录下来
5. **寻求帮助**：遇到问题随时问我

**预计完成时间**：2-4天
**成功率**：按照指南执行，100%成功！

开始行动吧！你马上就能看到你的IEclub应用在互联网上运行了！🚀