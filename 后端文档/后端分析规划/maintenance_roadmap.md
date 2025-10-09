# 🛠️ IEclub 后端维护和优化完整路线图

## 📅 开发计划（建议时间线）

### 🎯 第1周：环境搭建和基础测试
- [x] 安装开发环境
- [x] 复制所有代码文件
- [ ] 启动后端服务器
- [ ] 完成所有API测试
- [ ] 修复发现的bug

**检查清单：**
```bash
✓ Node.js 和 PostgreSQL 已安装
✓ 所有依赖安装成功
✓ 数据库创建成功
✓ .env 配置正确
✓ 服务器正常启动
✓ 所有API接口测试通过
✓ 日志正常输出
```

### 🎯 第2-3周：功能完善

#### 1. 邮箱验证系统 ⭐⭐⭐
```javascript
// 添加到 src/controllers/authController.js

// 发送验证邮件
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 生成验证token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 发送邮件
    await emailService.sendVerificationEmail(email, verificationToken);
    
    res.json({ message: '验证邮件已发送' });
  } catch (error) {
    res.status(500).json({ message: '发送失败' });
  }
};

// 验证邮箱
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await User.update(
      { emailVerified: true },
      { where: { email: decoded.email } }
    );
    
    res.json({ message: '邮箱验证成功' });
  } catch (error) {
    res.status(400).json({ message: '验证失败或已过期' });
  }
};

// 添加到 routes/auth.js
router.post('/send-verification', authMiddleware, authController.sendVerificationEmail);
router.get('/verify-email', authController.verifyEmail);
```

#### 2. 密码重置功能 ⭐⭐⭐
```javascript
// 忘记密码
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  await emailService.sendPasswordResetEmail(email, resetToken);
  
  res.json({ message: '重置链接已发送到邮箱' });
};

// 重置密码
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.update(
    { password: hashedPassword },
    { where: { email: decoded.email } }
  );
  
  res.json({ message: '密码重置成功' });
};
```

#### 3. 图片压缩优化 ⭐⭐
```javascript
// 安装 sharp
// npm install sharp

// 修改 src/services/uploadService.js
const sharp = require('sharp');
const path = require('path');

exports.compressAndUpload = async (file, folder) => {
  const compressedFileName = `compressed_${Date.now()}${path.extname(file.originalname)}`;
  const compressedPath = path.join(process.env.UPLOAD_DIR, folder, compressedFileName);
  
  // 压缩图片
  await sharp(file.path)
    .resize(1200, 1200, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 85 })
    .png({ quality: 85 })
    .toFile(compressedPath);
  
  // 删除原文件
  await fs.unlink(file.path);
  
  if (process.env.NODE_ENV === 'production') {
    return await uploadToOSS({ path: compressedPath }, folder);
  }
  
  return `/uploads/${folder}/${compressedFileName}`;
};
```

#### 4. 实时通知系统 ⭐⭐⭐
```javascript
// 安装依赖
// npm install socket.io

// 修改 src/server.js
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true
  }
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 加入用户房间
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开:', socket.id);
  });
});

// 导出io供其他模块使用
app.set('io', io);

// 在控制器中发送通知
// const io = req.app.get('io');
// io.to(`user_${userId}`).emit('notification', { type: 'like', message: '有人点赞了你的帖子' });
```

### 🎯 第4-5周：性能优化

#### 1. Redis缓存集成 ⭐⭐⭐⭐
```javascript
// Windows安装Redis: https://github.com/tporadowski/redis/releases
// 下载 Redis-x64-5.0.14.1.msi 安装

// 已有代码在 src/middleware/cache.js
// 使用示例：

// 缓存热门帖子
router.get('/hot', cacheMiddleware(600), postController.getHotPosts);

// 缓存用户信息
router.get('/:id', cacheMiddleware(300), userController.getUserProfile);

// 清除缓存
const { clearCache } = require('../middleware/cache');
await clearCache('posts:*'); // 清除所有帖子缓存
```

#### 2. 数据库索引优化 ⭐⭐⭐⭐
```sql
-- 创建数据库迁移文件
-- npx sequelize-cli migration:create --name add-indexes

-- 在迁移文件中添加：
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 用户表索引
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'idx_users_email'
    });
    
    await queryInterface.addIndex('users', ['username'], {
      name: 'idx_users_username'
    });
    
    // 帖子表索引
    await queryInterface.addIndex('posts', ['user_id'], {
      name: 'idx_posts_user_id'
    });
    
    await queryInterface.addIndex('posts', ['category'], {
      name: 'idx_posts_category'
    });
    
    await queryInterface.addIndex('posts', ['created_at'], {
      name: 'idx_posts_created_at'
    });
    
    // 评论表索引
    await queryInterface.addIndex('comments', ['post_id'], {
      name: 'idx_comments_post_id'
    });
    
    await queryInterface.addIndex('comments', ['user_id'], {
      name: 'idx_comments_user_id'
    });
    
    // 点赞表复合索引
    await queryInterface.addIndex('likes', ['user_id', 'post_id'], {
      unique: true,
      name: 'idx_likes_user_post'
    });
    
    // 活动表索引
    await queryInterface.addIndex('events', ['start_time'], {
      name: 'idx_events_start_time'
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('users', 'idx_users_email');
    // ... 其他索引
  }
};

-- 运行迁移
-- npm run db:migrate
```

#### 3. 查询优化 ⭐⭐⭐
```javascript
// 使用 Sequelize 的查询优化

// 1. 只查询需要的字段
const users = await User.findAll({
  attributes: ['id', 'username', 'avatar'], // 只查询需要的字段
});

// 2. 使用 include 代替多次查询
const posts = await Post.findAll({
  include: [
    { 
      model: User, 
      as: 'author',
      attributes: ['id', 'username', 'avatar']
    }
  ]
});

// 3. 分页查询优化（游标分页）
exports.getPostsCursor = async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  
  const where = cursor ? { 
    id: { [Op.lt]: cursor } 
  } : {};
  
  const posts = await Post.findAll({
    where,
    limit: parseInt(limit) + 1,
    order: [['id', 'DESC']]
  });
  
  const hasMore = posts.length > limit;
  const results = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? results[results.length - 1].id : null;
  
  res.json({
    posts: results,
    nextCursor,
    hasMore
  });
};

// 4. 批量查询
const postIds = [1, 2, 3, 4, 5];
const posts = await Post.findAll({
  where: { id: { [Op.in]: postIds } }
});

// 5. 原生SQL查询（复杂查询）
const [results] = await sequelize.query(`
  SELECT p.*, u.username, COUNT(l.id) as like_count
  FROM posts p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN likes l ON p.id = l.post_id
  WHERE p.created_at > NOW() - INTERVAL '7 days'
  GROUP BY p.id, u.username
  ORDER BY like_count DESC
  LIMIT 10
`);
```

#### 4. 文件存储优化 ⭐⭐⭐
```javascript
// 使用CDN加速
// 阿里云OSS配置CDN域名

// src/services/uploadService.js 优化
exports.uploadToOSS = async (file, folder) => {
  if (process.env.NODE_ENV === 'development') {
    // 本地开发：保存到本地
    return saveToLocal(file, folder);
  }
  
  // 生产环境：上传到OSS
  const ossClient = new OSS({
    region: process.env.ALI_OSS_REGION,
    accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
    bucket: process.env.ALI_OSS_BUCKET
  });
  
  const fileName = `${folder}/${Date.now()}-${path.basename(file.path)}`;
  const result = await ossClient.put(fileName, file.path);
  
  // 返回CDN URL而不是OSS URL
  const cdnUrl = result.url.replace(
    process.env.ALI_OSS_BUCKET + '.' + process.env.ALI_OSS_REGION,
    process.env.CDN_DOMAIN
  );
  
  await fs.unlink(file.path); // 删除本地文件
  return cdnUrl;
};
```

### 🎯 第6-7周：安全加固

#### 1. 防暴力破解 ⭐⭐⭐⭐
```javascript
// src/middleware/bruteForceProtection.js
const loginAttempts = new Map();

exports.bruteForceProtection = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const attempts = loginAttempts.get(identifier) || { count: 0, lockUntil: null };
  
  // 检查是否被锁定
  if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
    const remainingTime = Math.ceil((attempts.lockUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      message: `登录失败次数过多，请${remainingTime}分钟后再试`
    });
  }
  
  // 重置过期的锁定
  if (attempts.lockUntil && Date.now() >= attempts.lockUntil) {
    loginAttempts.delete(identifier);
  }
  
  // 记录本次请求
  req.loginIdentifier = identifier;
  next();
};

// 登录成功时清除记录
exports.clearAttempts = (identifier) => {
  loginAttempts.delete(identifier);
};

// 登录失败时增加计数
exports.recordFailedAttempt = (identifier) => {
  const attempts = loginAttempts.get(identifier) || { count: 0 };
  attempts.count += 1;
  
  // 5次失败后锁定30分钟
  if (attempts.count >= 5) {
    attempts.lockUntil = Date.now() + 30 * 60 * 1000;
  }
  
  loginAttempts.set(identifier, attempts);
};

// 在 authController.js 中使用
const { bruteForceProtection, clearAttempts, recordFailedAttempt } = require('../middleware/bruteForceProtection');

exports.login = [
  bruteForceProtection,
  async (req, res) => {
    // ... 登录逻辑
    if (loginSuccess) {
      clearAttempts(req.loginIdentifier);
    } else {
      recordFailedAttempt(req.loginIdentifier);
    }
  }
];
```

#### 2. 内容审核（敏感词过滤）⭐⭐⭐
```javascript
// src/utils/contentFilter.js
const sensitiveWords = [
  '敏感词1', '敏感词2', '违规词汇',
  // 可以从数据库或配置文件加载
];

// 创建正则表达式
const wordRegex = new RegExp(
  sensitiveWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\✓ 服务器正常启动')).join('|'),
  'gi'
);

exports.filterContent = (text) => {
  if (!text) return text;
  
  // 替换敏感词为 ***
  return text.replace(wordRegex, (match) => '*'.repeat(match.length));
};

exports.containsSensitiveWords = (text) => {
  if (!text) return false;
  return wordRegex.test(text);
};

// 在控制器中使用
const { filterContent, containsSensitiveWords } = require('../utils/contentFilter');

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  
  // 检查敏感词
  if (containsSensitiveWords(title) || containsSensitiveWords(content)) {
    return res.status(400).json({
      message: '内容包含敏感词，请修改后重新发布'
    });
  }
  
  // 过滤内容
  const filteredTitle = filterContent(title);
  const filteredContent = filterContent(content);
  
  // 创建帖子...
};
```

#### 3. SQL注入防护 ⭐⭐⭐⭐
```javascript
// Sequelize 已经防止了SQL注入
// 但要注意原生查询时的参数化

// ❌ 错误做法（有SQL注入风险）
const userId = req.params.id;
const query = `SELECT * FROM users WHERE id = ${userId}`;
await sequelize.query(query);

// ✅ 正确做法（参数化查询）
const userId = req.params.id;
const [results] = await sequelize.query(
  'SELECT * FROM users WHERE id = :userId',
  {
    replacements: { userId },
    type: sequelize.QueryTypes.SELECT
  }
);

// ✅ 使用 Sequelize ORM（自动防护）
const user = await User.findByPk(req.params.id);
```

#### 4. XSS防护 ⭐⭐⭐⭐
```javascript
// 安装 xss 库
// npm install xss

const xss = require('xss');

// src/utils/xssFilter.js
const options = {
  whiteList: {
    a: ['href', 'title', 'target'],
    b: [],
    strong: [],
    em: [],
    p: [],
    br: [],
    ul: [],
    ol: [],
    li: []
  }
};

exports.sanitizeHtml = (html) => {
  return xss(html, options);
};

// 在控制器中使用
const { sanitizeHtml } = require('../utils/xssFilter');

exports.createPost = async (req, res) => {
  const { content } = req.body;
  
  // 清理HTML内容
  const sanitizedContent = sanitizeHtml(content);
  
  await Post.create({
    content: sanitizedContent,
    // ...
  });
};
```

### 🎯 第8-10周：功能扩展

#### 1. 搜索功能增强 ⭐⭐⭐⭐
```javascript
// 全文搜索（PostgreSQL）
exports.fullTextSearch = async (req, res) => {
  const { q } = req.query;
  
  const posts = await sequelize.query(`
    SELECT *, 
      ts_rank(
        to_tsvector('chinese', title || ' ' || content),
        plainto_tsquery('chinese', :query)
      ) as rank
    FROM posts
    WHERE to_tsvector('chinese', title || ' ' || content) @@ plainto_tsquery('chinese', :query)
    ORDER BY rank DESC
    LIMIT 20
  `, {
    replacements: { query: q },
    type: sequelize.QueryTypes.SELECT
  });
  
  res.json({ posts });
};

// 或使用 Elasticsearch（更强大）
// npm install @elastic/elasticsearch
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

// 索引文档
await client.index({
  index: 'posts',
  id: post.id,
  body: {
    title: post.title,
    content: post.content,
    category: post.category
  }
});

// 搜索
const { body } = await client.search({
  index: 'posts',
  body: {
    query: {
      multi_match: {
        query: searchTerm,
        fields: ['title^2', 'content']
      }
    }
  }
});
```

#### 2. 推荐算法优化 ⭐⭐⭐⭐
```javascript
// 协同过滤推荐
exports.getRecommendations = async (userId) => {
  // 1. 获取用户的兴趣标签权重
  const userInterests = await getUserInterestWeights(userId);
  
  // 2. 获取用户的行为数据
  const userBehavior = await getUserBehavior(userId);
  
  // 3. 计算相似用户
  const similarUsers = await findSimilarUsers(userId, userInterests);
  
  // 4. 推荐相似用户喜欢的内容
  const recommendations = await getRecommendedContent(similarUsers, userBehavior);
  
  return recommendations;
};

// 基于内容的推荐
exports.getContentBasedRecommendations = async (userId) => {
  // 获取用户浏览/点赞过的帖子
  const likedPosts = await getUserLikedPosts(userId);
  
  // 提取关键词和标签
  const keywords = extractKeywords(likedPosts);
  
  // 查找相似内容
  const similarPosts = await Post.findAll({
    where: {
      [Op.or]: [
        { tags: { [Op.overlap]: keywords.tags } },
        { category: { [Op.in]: keywords.categories } }
      ],
      userId: { [Op.ne]: userId }
    },
    limit: 20
  });
  
  return similarPosts;
};
```

#### 3. 数据统计分析 ⭐⭐⭐
```javascript
// src/controllers/analyticsController.js

// 用户活跃度统计
exports.getUserStats = async (req, res) => {
  const stats = await sequelize.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as total_posts
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, { type: sequelize.QueryTypes.SELECT });
  
  res.json({ stats });
};

// 热门话题分析
exports.getTrendingTopics = async (req, res) => {
  const topics = await sequelize.query(`
    SELECT 
      unnest(tags) as topic,
      COUNT(*) as count,
      SUM(like_count) as total_likes
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY topic
    ORDER BY count DESC, total_likes DESC
    LIMIT 10
  `, { type: sequelize.QueryTypes.SELECT });
  
  res.json({ topics });
};

// 用户留存率
exports.getRetentionRate = async (req, res) => {
  // 实现留存率计算逻辑
};
```

#### 4. 导出功能 ⭐⭐
```javascript
// 导出用户数据（GDPR合规）
const ExcelJS = require('exceljs');

exports.exportUserData = async (req, res) => {
  const userId = req.user.id;
  
  // 获取用户所有数据
  const user = await User.findByPk(userId);
  const posts = await Post.findAll({ where: { userId } });
  const comments = await Comment.findAll({ where: { userId } });
  
  // 创建Excel
  const workbook = new ExcelJS.Workbook();
  
  // 用户信息表
  const userSheet = workbook.addWorksheet('用户信息');
  userSheet.columns = [
    { header: '字段', key: 'field' },
    { header: '值', key: 'value' }
  ];
  userSheet.addRows([
    { field: '用户名', value: user.username },
    { field: '邮箱', value: user.email },
    { field: '注册时间', value: user.createdAt }
  ]);
  
  // 帖子表
  const postSheet = workbook.addWorksheet('我的帖子');
  postSheet.columns = [
    { header: '标题', key: 'title' },
    { header: '内容', key: 'content' },
    { header: '发布时间', key: 'createdAt' }
  ];
  postSheet.addRows(posts);
  
  // 生成文件
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=user_data.xlsx');
  
  await workbook.xlsx.write(res);
  res.end();
};
```

### 🎯 第11-12周：测试和部署

#### 1. 单元测试 ⭐⭐⭐⭐
```javascript
// tests/unit/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Auth API', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
  });
  
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@sustech.edu.cn',
          password: 'password123',
          username: '测试用户',
          studentId: '12012345'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@sustech.edu.cn');
    });
    
    it('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@gmail.com',
          password: 'password123',
          username: '测试',
          studentId: '12012345'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
});

// 运行测试
// npm test
```

#### 2. 集成测试 ⭐⭐⭐
```javascript
// tests/integration/post-workflow.test.js

describe('Post Workflow', () => {
  let token;
  let postId;
  
  it('should complete full post workflow', async () => {
    // 1. 注册
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    token = registerRes.body.token;
    
    // 2. 创建帖子
    const createRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试帖子',
        content: '测试内容',
        category: '学术'
      });
    postId = createRes.body.post.id;
    expect(createRes.statusCode).toBe(201);
    
    // 3. 点赞
    const likeRes = await request(app)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(likeRes.statusCode).toBe(200);
    
    // 4. 评论
    const commentRes = await request(app)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '测试评论' });
    expect(commentRes.statusCode).toBe(201);
    
    // 5. 删除
    const deleteRes = await request(app)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.statusCode).toBe(200);
  });
});
```

#### 3. 部署准备 ⭐⭐⭐⭐⭐
```bash
# 1. 代码优化
npm run lint:fix

# 2. 运行测试
npm test

# 3. 构建（如果需要）
npm run build

# 4. 配置生产环境变量
cp .env.example .env.production
# 编辑 .env.production，配置真实的生产环境参数

# 5. 数据库备份
pg_dump ieclub_dev > backup.sql

# 6. 提交代码
git add .
git commit -m "准备部署"
git push origin main
```

## 🚀 持续改进清单

### 每周维护任务
- [ ] 检查错误日志
- [ ] 更新依赖包（npm update）
- [ ] 数据库备份
- [ ] 性能监控检查
- [ ] 用户反馈处理

### 每月优化任务
- [ ] 代码重构和优化
- [ ] 数据库清理（删除无用数据）
- [ ] 安全审计
- [ ] 负载测试
- [ ] 文档更新

### 长期目标
- [ ] 微服务拆分
- [ ] 容器化部署（Docker）
- [ ] CI/CD自动化
- [ ] 监控告警完善
- [ ] 多语言支持

---

## 📚 学习资源推荐

### 后端开发
- [Node.js官方文档](https://nodejs.org/docs)
- [Express.js指南](https://expressjs.com)
- [Sequelize文档](https://sequelize.org)
- [PostgreSQL教程](https://www.postgresqltutorial.com)

### 性能优化
- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [数据库索引优化](https://use-the-index-luke.com)

### 安全
- [OWASP安全指南](https://owasp.org)
- [Node.js安全清单](https://blog.risingstack.com/node-js-security-checklist/)

---

## 🎉 总结

**已完成：**
✅ 完整的后端代码（80+文件）
✅ 完善的功能模块
✅ 详细的文档
✅ Windows开发环境支持

**接下来：**
1. 按照路线图逐步完善功能
2. 进行充分测试
3. 准备部署上线

**记住：**
- 小步快跑，逐步迭代
- 重视代码质量和安全
- 保持文档更新
- 及时响应用户反馈

**祝您开发顺利！🚀**