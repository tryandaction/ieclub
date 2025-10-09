# IEclub Redis缓存和任务队列系统 - 完整文档

## 📋 目录

1. [系统概述](#系统概述)
2. [安装配置](#安装配置)
3. [功能特性](#功能特性)
4. [使用指南](#使用指南)
5. [监控管理](#监控管理)
6. [性能优化](#性能优化)
7. [常见问题](#常见问题)

---

## 🎯 系统概述

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                     应用层 (Express)                      │
├─────────────────────────────────────────────────────────┤
│  缓存中间件  │  队列服务  │  缓存服务  │  控制器层       │
├─────────────────────────────────────────────────────────┤
│              Redis Manager (连接管理)                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│  主客户端     │  订阅客户端   │  发布客户端   │  队列客户端 │
└──────────────┴──────────────┴──────────────┴────────────┘
                             ↓
                    ┌─────────────────┐
                    │   Redis Server  │
                    │   (6379端口)    │
                    └─────────────────┘
```

### 核心组件

1. **RedisManager**: Redis连接管理器
   - 支持主从复制
   - 自动重连机制
   - 连接池管理
   - 发布订阅支持

2. **QueueManager**: 任务队列管理器
   - 5个预定义队列（邮件、图片、通知、OCR、统计）
   - 失败重试机制
   - 优先级调度
   - 进度跟踪

3. **CacheMiddleware**: 缓存中间件
   - 响应缓存
   - 自动失效
   - 用户级缓存
   - 分页缓存

4. **CacheService**: 缓存服务
   - 用户缓存
   - 帖子缓存
   - 搜索缓存
   - 会话管理

---

## 🔧 安装配置

### 1. 安装Redis服务器

#### Windows

```bash
# 使用Chocolatey安装
choco install redis-64

# 或下载MSI安装包
# https://github.com/microsoftarchive/redis/releases

# 启动Redis
redis-server

# 测试连接
redis-cli ping
# 应该返回: PONG
```

#### macOS

```bash
# 使用Homebrew安装
brew install redis

# 启动Redis
brew services start redis

# 测试连接
redis-cli ping
```

#### Linux (Ubuntu/Debian)

```bash
# 安装Redis
sudo apt update
sudo apt install redis-server

# 启动Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli ping
```

### 2. 安装Node.js依赖

```bash
cd ieclub-backend

# 安装Redis相关包
npm install ioredis bull nodemailer

# 查看已安装版本
npm list ioredis bull
```

### 3. 配置环境变量

在 `.env` 文件中添加：

```env
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 队列配置
QUEUE_CONCURRENCY=5
QUEUE_REDIS_DB=1

# SMTP邮件配置（用于邮件队列）
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM="IEclub <noreply@ieclub.com>"

# 前端URL（用于邮件链接）
FRONTEND_URL=http://localhost:3000
```

### 4. 验证安装

创建测试脚本 `test-redis.js`：

```javascript
const redis = require('./src/utils/redis');

async function test() {
  try {
    // 初始化Redis
    await redis.init();
    console.log('✅ Redis初始化成功');

    // 测试PING
    const pong = await redis.ping();
    console.log('✅ PING测试:', pong);

    // 测试SET/GET
    await redis.set('test:key', { message: 'Hello IEclub!' }, 60);
    const data = await redis.get('test:key');
    console.log('✅ 数据测试:', data);

    // 测试完成
    await redis.del('test:key');
    await redis.close();
    console.log('✅ 所有测试通过!');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

test();
```

运行测试：

```bash
node test-redis.js
```

---

## ✨ 功能特性

### 1. 缓存系统

#### 响应缓存

```javascript
// 自动缓存GET请求响应
router.get('/posts', 
  CacheMiddleware.cache({ ttl: 300 }), // 缓存5分钟
  PostController.getPosts
);
```

#### 用户级缓存

```javascript
// 根据用户ID缓存
router.get('/my/posts',
  auth.required,
  CacheMiddleware.userCache(600), // 缓存10分钟
  PostController.getMyPosts
);
```

#### 分页缓存

```javascript
// 缓存分页结果
router.get('/posts',
  CacheMiddleware.pageCache(180), // 缓存3分钟
  PostController.getPosts
);
```

#### 详情缓存

```javascript
// 缓存资源详情
router.get('/posts/:id',
  CacheMiddleware.detailCache('post', 600), // 缓存10分钟
  PostController.getPost
);
```

#### 缓存失效

```javascript
// 更新时自动清除缓存
router.put('/posts/:id',
  auth.required,
  CacheMiddleware.invalidate([
    (req) => `cache:detail:post:${req.params.id}`,
    'cache:page:posts:*',
    'cache:list:posts:*'
  ]),
  PostController.updatePost
);
```

### 2. 任务队列

#### 邮件队列

```javascript
// 异步发送邮件
await QueueService.sendEmail(
  'user@example.com',
  '欢迎加入IEclub',
  '<h1>欢迎!</h1>',
  {
    priority: 3,  // 高优先级
    delay: 0      // 立即发送
  }
);

// 批量发送
await QueueService.sendBulkEmails([
  { to: 'user1@example.com', subject: '通知1', html: '...' },
  { to: 'user2@example.com', subject: '通知2', html: '...' }
]);
```

#### 图片处理队列

```javascript
// 异步压缩图片
const job = await QueueService.processImage(
  '/uploads/image.jpg',
  {
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080
  }
);

// 查询处理进度
const status = await QueueService.getJobStatus('image', job.id);
console.log(`处理进度: ${status.progress}%`);
```

#### 通知队列

```javascript
// 发送单个通知
await QueueService.sendNotification(
  userId,
  'like',
  {
    title: '新的点赞',
    content: '有人点赞了你的帖子'
  }
);

// 批量发送通知
await QueueService.sendBulkNotifications([
  { userId: 1, type: 'follow', title: '新关注', content: '...' },
  { userId: 2, type: 'comment', title: '新评论', content: '...' }
]);
```

#### OCR识别队列

```javascript
// 异步识别文字
const job = await QueueService.recognizeText(
  imagePath,
  userId,
  recordId
);

// 查询识别结果
const result = await QueueService.getJobStatus('ocr', job.id);
if (result.status === 'completed') {
  console.log('识别文字:', result.result.text);
}
```

#### 统计任务队列

```javascript
// 生成统计数据
await QueueService.generateStats('users', 'daily');
await QueueService.generateStats('posts', 'weekly');
await QueueService.generateStats('events', 'monthly');
```

### 3. 缓存服务API

#### 用户缓存

```javascript
const CacheService = require('./services/cacheService');

// 缓存用户信息
await CacheService.cacheUser(userId, userData, 3600);

// 获取用户信息
const user = await CacheService.getCachedUser(userId);

// 清除用户缓存
await CacheService.clearUserCache(userId);
```

#### 浏览计数

```javascript
// 增加浏览次数
const count = await CacheService.incrementViewCount('post', postId);

// 获取浏览次数
const views = await CacheService.getViewCount('post', postId);
```

#### 热门内容

```javascript
// 缓存帖子并更新热门榜
await CacheService.cachePost(postId, postData);

// 获取热门帖子
const hotPosts = await CacheService.getHotPosts(10);
```

#### 搜索缓存

```javascript
// 缓存搜索结果
await CacheService.cacheSearchResults(query, results, 300);
```

#### 会话管理

```javascript
// 设置会话
await CacheService.setSession(sessionId, sessionData, 86400);

// 获取会话
const session = await CacheService.getSession(sessionId);

// 删除会话
await CacheService.deleteSession(sessionId);
```

---

## 📊 监控管理

### 监控端点

所有监控端点需要管理员权限：

#### 1. Redis状态

```bash
GET /api/metrics/redis

# 响应示例
{
  "success": true,
  "data": {
    "connected": true,
    "usedMemory": "2.5M",
    "connectedClients": "3",
    "totalKeys": 1250,
    "hitRate": "87.5"
  }
}
```

#### 2. 队列状态

```bash
GET /api/metrics/queues

# 响应示例
{
  "success": true,
  "data": {
    "email": {
      "name": "email",
      "waiting": 5,
      "active": 2,
      "completed": 1230,
      "failed": 15,
      "delayed": 0,
      "total": 1252
    },
    "image": { ... },
    "notification": { ... }
  }
}
```

#### 3. 队列管理

```bash
# 暂停队列
POST /api/metrics/queues/email/pause

# 恢复队列
POST /api/metrics/queues/email/resume

# 清理已完成任务
POST /api/metrics/queues/email/clean

# 重试失败任务
POST /api/metrics/queues/email/retry

# 清除所有缓存
DELETE /api/metrics/cache
```

### 健康检查

```bash
GET /api/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2025-10-03T10:00:00.000Z",
  "services": {
    "redis": {
      "status": "up",
      "connected": true
    },
    "queues": {
      "email": { "status": "active", "jobs": 5 },
      "image": { "status": "active", "jobs": 2 }
    },
    "database": {
      "status": "up"
    }
  }
}
```

### 使用Redis CLI监控

```bash
# 连接到Redis
redis-cli

# 查看所有键
KEYS *

# 查看特定模式的键
KEYS cache:*
KEYS user:*
KEYS bull:*

# 查看键的值
GET user:123
HGETALL session:abc123

# 查看键的过期时间
TTL cache:post:456

# 查看内存使用
INFO memory

# 实时监控命令
MONITOR

# 查看慢日志
SLOWLOG GET 10

# 查看连接的客户端
CLIENT LIST

# 查看统计信息
INFO stats
```

---

## ⚡ 性能优化

### 1. 缓存策略

#### 缓存时间设置

```javascript
// 不同类型数据的推荐TTL
const cacheTTL = {
  // 静态内容 - 长时间缓存
  staticContent: 86400,      // 24小时
  userProfile: 3600,         // 1小时
  
  // 动态内容 - 中等时间缓存
  postList: 300,             // 5分钟
  postDetail: 600,           // 10分钟
  searchResults: 180,        // 3分钟
  
  // 实时内容 - 短时间缓存
  hotPosts: 60,              // 1分钟
  notification: 30,          // 30秒
  
  // 会话数据
  session: 86400,            // 24小时
  verificationCode: 600      // 10分钟
};
```

#### 缓存预热

```javascript
// 启动时预热热门数据
async function warmUpCache() {
  const { Post, User, Event } = require('./models');
  
  // 缓存热门帖子
  const hotPosts = await Post.findAll({
    where: { viewCount: { [Op.gt]: 1000 } },
    limit: 50
  });
  
  for (const post of hotPosts) {
    await CacheService.cachePost(post.id, post.toJSON());
  }
  
  // 缓存活跃用户
  const activeUsers = await User.findAll({
    where: { status: 'active' },
    order: [['lastLoginAt', 'DESC']],
    limit: 100
  });
  
  for (const user of activeUsers) {
    await CacheService.cacheUser(user.id, user.toJSON());
  }
  
  logger.info('缓存预热完成');
}
```

### 2. 队列优化

#### 并发控制

```javascript
// 设置队列并发数
const imageQueue = queueManager.createQueue('image', {
  limiter: {
    max: 50,           // 每分钟最多50个任务
    duration: 60000
  },
  settings: {
    maxStalledCount: 3,    // 最大停滞次数
    stalledInterval: 30000  // 检查间隔
  }
});

// 设置处理器并发
imageQueue.process(5, async (job) => {
  // 最多5个任务并发处理
  return await processImage(job.data);
});
```

#### 优先级队列

```javascript
// 根据业务重要性设置优先级
const priorities = {
  critical: 10,   // 紧急任务（支付、安全）
  high: 5,        // 高优先级（验证邮件）
  normal: 1,      // 普通任务（通知）
  low: 0          // 低优先级（统计）
};

// 添加任务时指定优先级
await emailQueue.add(data, {
  priority: priorities.high
});
```

### 3. Redis配置优化

#### redis.conf 优化建议

```conf
# 内存管理
maxmemory 2gb
maxmemory-policy allkeys-lru

# 持久化（根据需求选择）
save 900 1      # 900秒内至少1个键改变
save 300 10     # 300秒内至少10个键改变
save 60 10000   # 60秒内至少10000个键改变

# AOF持久化（更安全但稍慢）
appendonly yes
appendfsync everysec

# 网络优化
tcp-backlog 511
timeout 300
tcp-keepalive 300

# 慢查询日志
slowlog-log-slower-than 10000
slowlog-max-len 128
```

### 4. 监控指标

```javascript
// 定期收集性能指标
setInterval(async () => {
  const stats = await CacheService.getCacheStats();
  
  logger.info('Redis性能指标', {
    hitRate: stats.hitRate,
    usedMemory: stats.usedMemory,
    connectedClients: stats.connectedClients,
    totalKeys: stats.totalKeys
  });
  
  // 告警：命中率低于80%
  if (parseFloat(stats.hitRate) < 80) {
    logger.warn('缓存命中率过低！', { hitRate: stats.hitRate });
  }
  
  // 告警：连接数过多
  if (parseInt(stats.connectedClients) > 100) {
    logger.warn('Redis连接数过多！', { clients: stats.connectedClients });
  }
}, 60000); // 每分钟检查一次
```

---

## 🎓 使用指南

### 场景1：用户注册流程

```javascript
// 控制器
class AuthController {
  static async register(req, res) {
    try {
      const { email, password, nickname } = req.body;
      
      // 1. 创建用户
      const user = await User.create({
        email,
        password: await bcrypt.hash(password, 10),
        nickname,
        status: 'pending'
      });
      
      // 2. 生成验证token
      const token = jwt.sign(
        { userId: user.id, type: 'email_verify' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // 3. 缓存token（防止重复发送）
      const cacheKey = `verify:${user.id}`;
      await redis.set(cacheKey, token, 86400);
      
      // 4. 异步发送验证邮件
      await QueueService.sendEmail(
        email,
        'IEclub - 邮箱验证',
        emailTemplate.verification(user, token),
        { priority: 3 }
      );
      
      res.status(201).json({
        success: true,
        message: '注册成功，请查收验证邮件',
        data: { userId: user.id }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### 场景2：帖子发布流程

```javascript
class PostController {
  static async createPost(req, res) {
    try {
      const { title, content, images, tags } = req.body;
      const userId = req.user.id;
      
      // 1. 创建帖子
      const post = await Post.create({
        title,
        content,
        authorId: userId,
        status: 'published'
      });
      
      // 2. 处理图片（异步）
      if (images && images.length > 0) {
        const imageJobs = images.map(img => ({
          data: {
            imagePath: img.path,
            options: { quality: 80, maxWidth: 1920 }
          }
        }));
        await imageQueue.addBulk(imageJobs);
      }
      
      // 3. 清除相关缓存
      await redis.delPattern('cache:page:posts:*');
      await redis.delPattern('cache:list:posts:*');
      
      // 4. 通知关注者（异步）
      const followers = await user.getFollowers();
      const notifications = followers.map(f => ({
        userId: f.id,
        type: 'new_post',
        title: '新帖子',
        content: `${user.nickname}发布了新帖子: ${title}`
      }));
      await QueueService.sendBulkNotifications(notifications);
      
      // 5. 更新用户统计（异步）
      await User.increment('postCount', { where: { id: userId } });
      
      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### 场景3：活动报名流程

```javascript
class EventController {
  static async registerEvent(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      
      // 1. 使用Redis实现分布式锁（防止超额报名）
      const lockKey = `lock:event:${eventId}`;
      const lockValue = Date.now().toString();
      
      // 尝试获取锁（10秒超时）
      const locked = await redis.getClient().set(
        lockKey,
        lockValue,
        'NX',
        'EX',
        10
      );
      
      if (!locked) {
        return res.status(409).json({
          success: false,
          error: '报名人数过多，请稍后重试'
        });
      }
      
      try {
        // 2. 检查活动
        const event = await Event.findByPk(eventId);
        if (!event) {
          return res.status(404).json({
            success: false,
            error: '活动不存在'
          });
        }
        
        // 3. 检查人数限制
        const currentCount = await EventRegistration.count({
          where: { eventId, status: 'confirmed' }
        });
        
        if (currentCount >= event.maxParticipants) {
          return res.status(400).json({
            success: false,
            error: '活动已满员'
          });
        }
        
        // 4. 创建报名记录
        const registration = await EventRegistration.create({
          eventId,
          userId,
          status: 'confirmed'
        });
        
        // 5. 发送确认邮件（异步）
        await QueueService.sendEmail(
          req.user.email,
          `活动报名确认 - ${event.title}`,
          emailTemplate.eventConfirmation(req.user, event),
          { priority: 2 }
        );
        
        // 6. 清除活动缓存
        await redis.del(`cache:detail:event:${eventId}`);
        
        res.json({
          success: true,
          data: registration
        });
        
      } finally {
        // 7. 释放锁
        const currentLock = await redis.get(lockKey);
        if (currentLock === lockValue) {
          await redis.del(lockKey);
        }
      }
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### 场景4：OCR识别流程

```javascript
class OCRController {
  static async uploadAndRecognize(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      // 1. 验证文件
      if (!file) {
        return res.status(400).json({
          success: false,
          error: '请上传图片'
        });
      }
      
      // 2. 检查频率限制（每小时最多10次）
      const rateLimitKey = `ocr:rate:${userId}`;
      const count = await redis.incr(rateLimitKey);
      
      if (count === 1) {
        await redis.expire(rateLimitKey, 3600);
      }
      
      if (count > 10) {
        return res.status(429).json({
          success: false,
          error: '识别次数已达上限，请1小时后再试'
        });
      }
      
      // 3. 创建记录
      const record = await OCRRecord.create({
        userId,
        imagePath: file.path,
        status: 'processing'
      });
      
      // 4. 添加到队列
      const job = await QueueService.recognizeText(
        file.path,
        userId,
        record.id
      );
      
      res.status(202).json({
        success: true,
        message: '图片上传成功，正在识别中...',
        data: {
          recordId: record.id,
          jobId: job.id,
          estimatedTime: '30-60秒'
        }
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // 轮询查询结果
  static async getRecognitionResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const record = await OCRRecord.findOne({
        where: { id, userId }
      });
      
      if (!record) {
        return res.status(404).json({
          success: false,
          error: '记录不存在'
        });
      }
      
      res.json({
        success: true,
        data: {
          id: record.id,
          status: record.status,
          result: record.result,
          confidence: record.confidence
        }
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

---

## 🐛 常见问题

### 1. Redis连接失败

**问题**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**解决方案**:
```bash
# 检查Redis是否运行
redis-cli ping

# 如果没运行，启动Redis
# Windows
redis-server

# Linux/macOS
redis-server /etc/redis/redis.conf
```

### 2. 队列任务停滞

**问题**: 任务一直处于waiting状态不执行

**解决方案**:
```javascript
// 检查是否注册了处理器
emailQueue.process(async (job) => {
  // 处理逻辑
});

// 或者手动触发处理
const queue = queueManager.getQueue('email');
await queue.resume();
```

### 3. 缓存命中率低

**问题**: 缓存命中率低于50%

**解决方案**:
```javascript
// 1. 增加缓存时间
CacheMiddleware.cache({ ttl: 600 }) // 从300改为600

// 2. 使用更精确的缓存键
keyGenerator: (req) => {
  const { page, limit } = req.query;
  return `cache:posts:${page}:${limit}`; // 不包含随机参数
}

// 3. 预热热门数据
await warmUpCache();
```

### 4. 内存使用过高

**问题**: Redis内存占用过高

**解决方案**:
```bash
# 1. 查看内存使用
redis-cli INFO memory

# 2. 清理过期键
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL

# 3. 配置内存淘汰策略
# 在redis.conf中添加
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 5. 队列任务失败过多

**问题**: 任务失败率超过10%

**解决方案**:
```javascript
// 1. 增加重试次数
await emailQueue.add(data, {
  attempts: 5,  // 从3改为5
  backoff: {
    type: 'exponential',
    delay: 3000  // 增加延迟
  }
});

// 2. 添加超时设置
await ocrQueue.add(data, {
  timeout: 120000  // 2分钟超时
});

// 3. 手动重试失败任务
await queueManager.retryFailed('email');
```

---

## 📈 性能基准

### 预期性能指标

| 指标 | 目标值 | 优秀值 |
|------|--------|--------|
| 缓存命中率 | >80% | >90% |
| Redis响应时间 | <10ms | <5ms |
| 队列处理速度 | >100任务/分 | >500任务/分 |
| 内存使用 | <2GB | <1GB |
| 并发连接数 | <50 | <20 |

### 压力测试

```bash
# 使用redis-benchmark测试
redis-benchmark -h localhost -p 6379 -c 50 -n 100000

# 测试SET性能
redis-benchmark -t set -n 100000 -q

# 测试GET性能
redis-benchmark -t get -n 100000 -q

# 测试完整流程
redis-benchmark -t set,get,lpush,lpop -n 100000 -q
```

---

## 🚀 最佳实践

### 1. 键命名规范

```javascript
// 使用冒号分隔的层级结构
cache:page:posts:1:20
cache:detail:post:123
user:profile:456
session:abc123
lock:event:789
queue:email:job:1001
```

### 2. 错误处理

```javascript
// 缓存操作失败不应影响主流程
try {
  await redis.set(key, value, ttl);
} catch (error) {
  logger.error('缓存设置失败:', error);
  // 继续执行，不中断主流程
}
```

### 3. 监控告警

```javascript
// 设置性能监控
const monitor = {
  checkHealth: async () => {
    const stats = await CacheService.getCacheStats();
    
    if (parseFloat(stats.hitRate) < 70) {
      // 发送告警
      await alertService.send('Redis命中率过低', stats);
    }
  }
};

// 每5分钟检查一次
setInterval(monitor.checkHealth, 300000);
```

### 4. 数据一致性

```javascript
// 更新数据库时同步清除缓存
async function updatePost(postId, data) {
  const transaction = await sequelize.transaction();
  
  try {
    // 更新数据库
    await Post.update(data, {
      where: { id: postId },
      transaction
    });
    
    // 提交事务
    await transaction.commit();
    
    // 清除缓存
    await redis.del(`cache:detail:post:${postId}`);
    await redis.delPattern(`cache:page:posts:*`);
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## 📚 参考资源

- [ioredis 文档](https://github.com/redis/ioredis)
- [Bull 队列文档](https://github.com/OptimalBits/bull)
- [Redis 官方文档](https://redis.io/documentation)
- [缓存最佳实践](https://redis.io/topics/lru-cache)

---

## 🎉 总结

你现在拥有了一个**商业级的Redis缓存和任务队列系统**，包括：

✅ **完整的代码实现**
- RedisManager (连接管理)
- QueueManager (队列管理)  
- CacheMiddleware (缓存中间件)
- CacheService (缓存服务)
- QueueService (队列服务)

✅ **5个预定义队列**
- 邮件队列
- 图片处理队列
- 通知队列
- OCR识别队列
- 统计任务队列

✅ **监控和管理**
- 完整的监控端点
- 健康检查系统
- 性能统计分析

✅ **生产就绪**
- 自动重连机制
- 失败重试策略
- 优雅关闭处理
- 详细日志记录

**立即开始使用**:
```bash
npm install ioredis bull nodemailer
node test-redis.js
npm run dev
```