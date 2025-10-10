# 🚀 IEclub 小程序集成与域名部署指南

## 📋 项目目标

让你的IEclub应用：
- ✅ 通过域名 `www.ieclub.online` 和 `ieclub.online` 访问
- ✅ 支持微信小程序集成
- ✅ 实现完整的移动端体验

## 🎯 第一阶段：域名部署（1-2天）

### 1.1 服务器准备

#### 选择服务器方案：

**方案A：阿里云/腾讯云轻量服务器（推荐）**
- 💰 费用：￥200-300/年
- ⚡ 配置：2核4G，40G SSD
- 🌐 带宽：3-5M

**方案B：VPS服务器**
- 💰 费用：￥300-500/年
- ⚡ 配置：2核4G，50G SSD
- 🌐 带宽：5M

#### 推荐配置清单：
- [ ] Ubuntu 20.04 LTS 系统
- [ ] 2核 CPU，4G内存，50G硬盘
- [ ] 公网IP地址
- [ ] 域名已购买并可管理DNS

### 1.2 域名解析配置

在你的域名服务商处配置DNS：

```dns
# A记录 - 指向你的服务器IP
www     A     your-server-ip
@       A     your-server-ip

# 如果使用CDN，可以添加CNAME记录
cdn     CNAME your-cdn-domain
```

**验证域名解析**：
```bash
nslookup www.ieclub.online
nslookup ieclub.online
```

### 1.3 服务器环境搭建

#### 安装基础软件：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18+
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
```

#### 配置防火墙：
```bash
# 开放端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # 后端API端口
sudo ufw --force enable
```

### 1.4 部署后端服务

#### 1.4.1 配置环境变量：
```bash
cd ~/ieclub-backend

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
nano .env
```

**生产环境 .env 配置**：
```bash
NODE_ENV=production
PORT=5000
API_VERSION=v1

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub_prod
DB_USER=ieclub_user
DB_PASSWORD=your-secure-password-here

# JWT配置（必须修改！）
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# CORS配置（你的域名）
CORS_ORIGIN=https://www.ieclub.online,https://ieclub.online

# 前端URL
FRONTEND_URL=https://www.ieclub.online

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 百度OCR（小程序需要）
BAIDU_OCR_API_KEY=your-baidu-ocr-api-key
BAIDU_OCR_SECRET_KEY=your-baidu-ocr-secret-key

# Sentry监控
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### 1.4.2 初始化数据库：
```bash
# 创建数据库和用户
sudo -u postgres psql
```

在PostgreSQL中执行：
```sql
CREATE DATABASE ieclub_prod;
CREATE USER ieclub_user WITH PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE ieclub_prod TO ieclub_user;
ALTER USER ieclub_user CREATEDB;
\q
```





#### 1.4.3 安装依赖并启动：
```bash
# 安装依赖
npm install

# 运行数据库迁移
npm run migrate

# 使用PM2启动服务
pm2 start src/server.js --name "ieclub-backend" --env production

# 设置开机自启
pm2 startup
pm2 save
```

### 1.5 部署前端服务

#### 1.5.1 配置前端环境变量：
```bash
cd ~/ieclub-frontend

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
nano .env
```

**前端 .env 配置**：
```bash
VITE_API_BASE_URL=https://www.ieclub.online/api/v1
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛
VITE_PUBLIC_URL=https://www.ieclub.online
```

#### 1.5.2 构建和部署：
```bash
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

### 1.6 配置Nginx

#### 1.6.1 创建Nginx配置：
```bash
sudo nano /etc/nginx/sites-available/ieclub
```

**Nginx配置内容**：
```nginx
# HTTP自动跳转HTTPS
server {
    listen 80;
    server_name www.ieclub.online ieclub.online;
    return 301 https://$server_name$request_uri;
}

# HTTPS主站配置
server {
    listen 443 ssl http2;
    server_name www.ieclub.online ieclub.online;

    # SSL证书（稍后配置）
    # ssl_certificate /etc/letsencrypt/live/www.ieclub.online/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/www.ieclub.online/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/ieclub;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";

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

            # 超时配置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }

    # 文件上传代理
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
    }
}
```

#### 1.6.2 启用配置：
```bash
# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 启用新配置
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 1.7 配置HTTPS证书

#### 使用Let's Encrypt免费证书：
```bash
# 为域名生成证书
sudo certbot --nginx -d www.ieclub.online -d ieclub.online

# 设置自动续期
sudo crontab -e
# 添加：0 3 * * * certbot renew --quiet
```

**验证HTTPS**：
```bash
curl -I https://www.ieclub.online
curl -I https://ieclub.online
```

### 1.8 域名部署验证

访问以下地址确认部署成功：

- 🌐 **主站**：https://www.ieclub.online
- 🔗 **API文档**：https://www.ieclub.online/api/v1
- 💚 **健康检查**：https://www.ieclub.online/health

## 🎯 第二阶段：小程序集成（2-3天）

### 2.1 小程序后端接口配置

小程序需要特定的接口格式和配置：

#### 2.1.1 更新CORS配置支持小程序：
```javascript
// 在 app.js 中添加小程序域名
const corsOptions = {
  origin: [
    'https://www.ieclub.online',
    'https://ieclub.online',
    // 小程序端域名（微信小程序的请求域名）
    'https://mp.ieclub.online',  // 如果有小程序专用域名
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### 2.1.2 小程序专用接口：

小程序需要一些特殊的接口，比如微信登录、支付等。让我为你创建这些接口。

### 2.2 小程序必需的后端接口

#### 2.2.1 微信登录接口：
```javascript
// controllers/wechatController.js
exports.wechatLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    // 调用微信API获取openid
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_MINIPROGRAM_APPID,
        secret: process.env.WECHAT_MINIPROGRAM_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key } = wxResponse.data;

    // 查找或创建用户
    let user = await User.findOne({ where: { wechatOpenid: openid } });

    if (!user) {
      // 新用户，创建账号
      user = await User.create({
        username: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        wechatOpenid: openid,
        // 其他必要字段
      });
    }

    // 生成JWT token
    const token = generateToken(user.id);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });

  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败'
    });
  }
};
```

#### 2.2.2 小程序支付接口：
```javascript
// controllers/paymentController.js
exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // 调用微信支付统一下单API
    const paymentData = {
      appid: process.env.WECHAT_MINIPROGRAM_APPID,
      mch_id: process.env.WECHAT_MCH_ID,
      nonce_str: generateNonce(),
      body: 'IEclub服务费',
      out_trade_no: orderId,
      total_fee: amount,
      spbill_create_ip: req.ip,
      notify_url: `${process.env.FRONTEND_URL}/api/payment/notify`,
      trade_type: 'JSAPI',
      openid: req.user.wechatOpenid
    };

    // 签名并发送请求
    const response = await wechatPay.unifiedOrder(paymentData);

    res.json({
      code: 200,
      data: {
        payment: response
      }
    });

  } catch (error) {
    console.error('创建支付失败:', error);
    res.status(500).json({
      code: 500,
      message: '支付创建失败'
    });
  }
};
```

### 2.3 小程序环境变量配置

在后端 `.env` 文件中添加小程序配置：

```bash
# 微信小程序配置
WECHAT_MINIPROGRAM_APPID=your-miniprogram-appid
WECHAT_MINIPROGRAM_SECRET=your-miniprogram-secret

# 微信支付配置（如果需要）
WECHAT_MCH_ID=your-mch-id
WECHAT_PAY_KEY=your-pay-key
WECHAT_CERT_PATH=./certs/apiclient_cert.pem
WECHAT_KEY_PATH=./certs/apiclient_key.pem
```

## 🎯 第三阶段：小程序开发（3-5天）

### 3.1 小程序项目结构

```
miniprogram/
├── app.js              # 小程序入口文件
├── app.json           # 小程序配置
├── app.wxss           # 小程序样式
├── sitemap.json       # 搜索优化
├── pages/             # 页面目录
│   ├── index/         # 首页
│   ├── profile/       # 个人主页
│   ├── posts/         # 帖子页面
│   └── events/        # 活动页面
├── components/        # 组件目录
├── utils/             # 工具库
├── services/          # API服务
└── config/            # 配置文件
```

### 3.2 小程序核心配置

#### app.json 配置：
```json
{
  "pages": [
    "pages/index/index",
    "pages/profile/profile",
    "pages/posts/posts",
    "pages/events/events"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "IEclub",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png",
        "text": "首页"
      },
      {
        "pagePath": "pages/events/events",
        "iconPath": "images/events.png",
        "selectedIconPath": "images/events-active.png",
        "text": "活动"
      },
      {
        "pagePath": "pages/posts/posts",
        "iconPath": "images/posts.png",
        "selectedIconPath": "images/posts-active.png",
        "text": "论坛"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "images/profile.png",
        "selectedIconPath": "images/profile-active.png",
        "text": "我的"
      }
    ]
  },
  "networkTimeout": {
    "request": 60000,
    "downloadFile": 60000
  },
  "debug": true
}
```

### 3.3 小程序API封装

#### services/api.js：
```javascript
// 小程序API基础配置
const API_BASE_URL = 'https://www.ieclub.online/api/v1';

// 小程序专用请求函数
export const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: reject
    });
  });
};

// API方法封装
export const api = {
  // 微信登录
  wechatLogin: (code) => request('/auth/wechat-login', {
    method: 'POST',
    data: { code }
  }),

  // 帖子相关
  getPosts: (params) => request(`/posts?${new URLSearchParams(params)}`),
  createPost: (postData) => request('/posts', {
    method: 'POST',
    data: postData
  }),

  // 用户相关
  getCurrentUser: () => request('/auth/me'),
  updateProfile: (userData) => request('/users/me', {
    method: 'PUT',
    data: userData
  }),

  // 活动相关
  getEvents: () => request('/events'),
  joinEvent: (eventId) => request(`/events/${eventId}/register`, {
    method: 'POST'
  })
};
```

## 📋 部署检查清单

### 域名部署检查：
- [ ] 域名DNS解析正确
- [ ] 服务器安全组开放80、443、5000端口
- [ ] Node.js、Nginx、PostgreSQL、Redis已安装
- [ ] 后端服务通过PM2运行
- [ ] 前端静态文件部署完成
- [ ] HTTPS证书配置成功
- [ ] 网站可以正常访问

### 小程序检查：
- [ ] 微信小程序AppID已申请
- [ ] 小程序服务器域名已配置
- [ ] 小程序合法域名已设置
- [ ] 小程序代码开发完成
- [ ] 小程序可以正常登录和使用

## 🚨 常见问题解决

### 1. 域名无法访问
```bash
# 检查域名解析
nslookup www.ieclub.online

# 检查服务器端口
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# 检查Nginx状态
sudo systemctl status nginx
```

### 2. HTTPS证书问题
```bash
# 检查证书
sudo certbot certificates

# 重新生成证书
sudo certbot --nginx -d www.ieclub.online -d ieclub.online --force-renewal
```

### 3. 小程序登录失败
- 检查小程序AppID和Secret配置
- 确认后端微信登录接口正常
- 检查小程序合法域名配置

## 🎉 完成目标

完成以上步骤后，你将拥有：

1. ✅ **可访问的Web应用**：https://www.ieclub.online
2. ✅ **微信小程序**：可以在微信中搜索和使用
3. ✅ **完整的功能**：论坛、活动、智能匹配、OCR等
4. ✅ **移动端优化**：完美的小程序体验

## 📞 寻求帮助

部署过程中遇到问题：

1. 查看PM2日志：`pm2 logs`
2. 查看Nginx日志：`sudo tail -f /var/log/nginx/error.log`
3. 在GitHub Issues中提交问题
4. 联系技术支持

祝你部署成功！🚀