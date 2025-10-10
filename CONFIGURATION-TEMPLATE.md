# ⚙️ IEclub 配置信息模板 - 精确版

## 📋 重要提醒

以下是你需要填写的**所有配置信息**，包含了**具体文件位置和代码位置**。请按顺序填写，并妥善保存这些信息。




## 🔍 第五部分：百度OCR配置

### 📍 位置：`ieclub-backend/.env` 文件

**原始代码**（第68-69行）：
```bash
BAIDU_OCR_API_KEY=your_api_key
BAIDU_OCR_SECRET_KEY=your_secret_key
```

```bash
BAIDU_OCR_API_KEY=【请填写你的百度API Key】
BAIDU_OCR_SECRET_KEY=【请填写你的百度Secret Key】
```



## 📧 第六部分：邮箱配置（可选）

### 📍 位置：`ieclub-backend/.env` 文件

**原始代码**（第33-37行）：
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ieclub.com
SMTP_PASSWORD=your_email_password
EMAIL_FROM=IEclub <noreply@ieclub.com>
```

**需要你填写的**：
```bash
SMTP_HOST=smtp.qq.com
SMTP_USER=【请填写你的邮箱】______________________
SMTP_PASSWORD=【请填写你的邮箱授权码】______________________
EMAIL_FROM=IEclub <【请填写你的邮箱】______________________
```

**📝 记录你的邮箱信息**：
- 邮箱地址：______________________
- 邮箱授权码：______________________

---

## 🌍 第七部分：前端配置

### 📍 位置：`ieclub-frontend/.env` 文件

**原始代码**（新建文件）：
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛
VITE_PUBLIC_URL=https://www.ieclub.online
```

**需要你填写的**：
```bash
VITE_API_BASE_URL=https://www.ieclub.online/api/v1
VITE_APP_TITLE=IEclub - 学生跨学科交流论坛
VITE_PUBLIC_URL=https://www.ieclub.online
```

---

## 📊 第八部分：小程序域名白名单配置

### 📍 位置：微信小程序后台 → 开发 → 开发管理 → 开发设置 → 服务器域名

**需要添加的域名**：
```
https://www.ieclub.online
```

**在小程序后台添加**：
- request合法域名：`https://www.ieclub.online`
- uploadFile合法域名：`https://www.ieclub.online`
- downloadFile合法域名：`https://www.ieclub.online`

---

## 🔒 第九部分：HTTPS证书信息

### 📍 位置：服务器自动生成
```
/etc/letsencrypt/live/www.ieclub.online/fullchain.pem
/etc/letsencrypt/live/www.ieclub.online/privkey.pem
```

---

## 🏫 第十部分：代码中的硬编码信息（需要修改）

### 10.1 学校名称硬编码

#### 📍 文件：`ieclub-backend/src/models/User.js`
**位置**：第58行和第338行
**原始代码**：
```javascript
school: '南方科技大学'
```
**建议修改为**：
```javascript
school: process.env.DEFAULT_SCHOOL || '南方科技大学'
```

#### 📍 文件：`ieclub-frontend/src/components/layout/Navbar.jsx`
**位置**：第43行
**原始代码**：
```javascript
<p className="text-xs text-gray-500 hidden sm:block">南方科技大学学生社区</p>
```
**建议修改为**：
```javascript
<p className="text-xs text-gray-500 hidden sm:block">{process.env.VITE_SCHOOL_NAME || '南方科技大学学生社区'}</p>
```

### 10.2 邮箱域名限制硬编码

#### 📍 文件：`ieclub-backend/src/models/User.js`
**位置**：第38-42行
**原始代码**：
```javascript
const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'sustech.edu.cn,mail.sustech.edu.cn').split(',');
```
**需要你填写的**（在.env文件中）：
```bash
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,gmail.com,qq.com,163.com
```

### 10.3 院系信息硬编码

#### 📍 文件：`ieclub-backend/src/models/User.js`
**位置**：第64-78行
**原始代码**：
```javascript
'计算机科学与工程系',
'电子与电气工程系',
// ... 更多院系
```
**建议修改为**：从数据库表获取或配置文件读取

---

## 📋 配置检查清单（带文件位置）

### 必须填写的配置：
- [ ] **ieclub-backend/.env** - DB_PASSWORD（第17行）
- [ ] **ieclub-backend/.env** - JWT_SECRET（第22行）
- [ ] **ieclub-backend/.env** - JWT_REFRESH_SECRET（第24行）
- [ ] **ieclub-backend/.env** - WECHAT_MINIPROGRAM_APPID（第66行）
- [ ] **ieclub-backend/.env** - WECHAT_MINIPROGRAM_SECRET（第67行）
- [ ] **ieclub-backend/.env** - BAIDU_OCR_API_KEY（第68行）
- [ ] **ieclub-backend/.env** - BAIDU_OCR_SECRET_KEY（第69行）
- [ ] **ieclub-frontend/.env** - VITE_API_BASE_URL（第2行）

### 需要修改的硬编码：
- [ ] **ieclub-backend/src/models/User.js** - 第58行学校名称
- [ ] **ieclub-frontend/src/components/layout/Navbar.jsx** - 第43行学校名称
- [ ] **ieclub-backend/.env** - ALLOWED_EMAIL_DOMAINS（第41行）

### 可选配置：
- [ ] **ieclub-backend/.env** - SENTRY_DSN（第85行）
- [ ] **ieclub-backend/.env** - SMTP_USER, SMTP_PASSWORD（第35-36行）

---

## ⚠️ 安全提醒

1. **密码安全**：
   - 数据库密码至少12位，包含字母、数字、特殊字符
   - JWT密钥至少32位，随机生成
   - 不要使用简单密码如"123456"或"password"

2. **密钥保护**：
   - 不要将.env文件提交到Git仓库
   - 生产环境不要开启调试模式
   - 定期更换JWT密钥

3. **备份重要信息**：
   - 将本文件填写完成后保存到安全位置
   - 记录所有密码和密钥
   - 备份数据库和重要配置文件

---

## 🚨 常见配置错误（带具体位置）

### 错误1：数据库连接失败
**位置**：`ieclub-backend/.env` 第17行
**原因**：数据库密码错误或用户权限不足
**解决**：检查DB_PASSWORD和数据库用户权限

### 错误2：小程序登录失败
**位置**：`ieclub-backend/.env` 第66-67行
**原因**：小程序AppID或Secret错误
**解决**：检查WECHAT_MINIPROGRAM_APPID和WECHAT_MINIPROGRAM_SECRET

### 错误3：OCR功能不工作
**位置**：`ieclub-backend/.env` 第68-69行
**原因**：百度OCR凭证错误
**解决**：检查BAIDU_OCR_API_KEY和BAIDU_OCR_SECRET_KEY

### 错误4：HTTPS证书问题
**位置**：服务器Nginx配置
**原因**：域名未指向正确IP或证书未生效
**解决**：检查域名解析和证书状态

---

## 💡 配置完成后

1. **保存本文件**：将填写后的配置信息保存到安全位置
2. **测试连接**：确保所有服务能正常连接
3. **备份配置**：定期备份配置文件
4. **监控日志**：关注应用运行日志

**你的配置填写完成日期**：____ 年 __ 月 __ 日

**最后更新日期**：____ 年 __ 月 __ 日

---

## 📞 寻求帮助

如果配置过程中遇到问题：

1. 检查本文件的配置是否正确填写
2. 查看服务器日志：`pm2 logs`
3. 查看Nginx日志：`sudo tail -f /var/log/nginx/error.log`
4. 在GitHub Issues中提交问题

记住：**所有配置信息都需要你手动填写**，这是因为AI无法访问你的真实账号信息。填写完成后，你的IEclub就能正常运行了！

## 🎯 快速配置清单

**立即填写**（按优先级）：
1. 数据库密码 → `ieclub-backend/.env` 第17行
2. JWT密钥 → `ieclub-backend/.env` 第22、24行
3. 小程序凭证 → `ieclub-backend/.env` 第66-67行
4. 百度OCR凭证 → `ieclub-backend/.env` 第68-69行
5. 前端API地址 → `ieclub-frontend/.env` 第2行
6. 修改学校名称硬编码 → 相关文件第58、43行