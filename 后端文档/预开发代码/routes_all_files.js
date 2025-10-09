// ==================== src/routes/index.js ====================
const express = require('express');
const router = express.Router();

// 导入所有子路由
const authRoutes = require('./auth');
const userRoutes = require('./user');
const postRoutes = require('./post');
const eventRoutes = require('./event');
const matchRoutes = require('./match');
const ocrRoutes = require('./ocr');

// 挂载路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/events', eventRoutes);
router.use('/match', matchRoutes);
router.use('/ocr', ocrRoutes);

// API信息接口
router.get('/', (req, res) => {
  res.json({
    message: 'IEclub API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/auth - 认证相关',
      users: '/users - 用户相关',
      posts: '/posts - 帖子相关',
      events: '/events - 活动相关',
      match: '/match - 好友匹配',
      ocr: '/ocr - OCR识别'
    },
    documentation: 'https://github.com/yourusername/ieclub-backend/blob/main/README.md'
  });
});

module.exports = router;


// ==================== src/routes/auth.js ====================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { 
  updateProfileValidation,
  idParamValidation,
  paginationValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   GET /api/v1/users/search
 * @desc    搜索用户
 * @access  Public
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /api/v1/users/popular
 * @desc    获取热门用户
 * @access  Public
 */
router.get('/popular', userController.getPopularUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    获取用户详细信息
 * @access  Public
 */
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  userController.getUserProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    更新个人信息
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  updateProfileValidation,
  handleValidationErrors,
  userController.updateProfile
);

/**
 * @route   POST /api/v1/users/avatar
 * @desc    上传头像
 * @access  Private
 */
router.post(
  '/avatar',
  authMiddleware,
  upload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @route   PUT /api/v1/users/homepage
 * @desc    更新个人主页
 * @access  Private
 */
router.put(
  '/homepage',
  authMiddleware,
  userController.updateHomepage
);

/**
 * @route   GET /api/v1/users/:id/posts
 * @desc    获取用户发布的帖子
 * @access  Public
 */
router.get(
  '/:id/posts',
  idParamValidation,
  paginationValidation,
  handleValidationErrors,
  userController.getUserPosts
);

/**
 * @route   GET /api/v1/users/:id/events
 * @desc    获取用户组织的活动
 * @access  Public
 */
router.get(
  '/:id/events',
  idParamValidation,
  paginationValidation,
  handleValidationErrors,
  userController.getUserEvents
);

module.exports = router;


// ==================== src/routes/post.js ====================
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { 
  createPostValidation,
  idParamValidation,
  paginationValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   GET /api/v1/posts
 * @desc    获取帖子列表（支持筛选、排序、搜索）
 * @access  Public
 */
router.get(
  '/',
  paginationValidation,
  handleValidationErrors,
  postController.getPosts
);

/**
 * @route   GET /api/v1/posts/bookmarked
 * @desc    获取我收藏的帖子
 * @access  Private
 */
router.get(
  '/bookmarked',
  authMiddleware,
  paginationValidation,
  handleValidationErrors,
  postController.getBookmarkedPosts
);

/**
 * @route   GET /api/v1/posts/:id
 * @desc    获取单个帖子详情
 * @access  Public（登录后显示点赞收藏状态）
 */
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  optionalAuth || ((req, res, next) => next()), // 可选认证
  postController.getPostById
);

/**
 * @route   POST /api/v1/posts
 * @desc    创建帖子
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  upload.array('images', 9), // 最多9张图片
  createPostValidation,
  handleValidationErrors,
  postController.createPost
);

/**
 * @route   PUT /api/v1/posts/:id
 * @desc    更新帖子
 * @access  Private
 */
router.put(
  '/:id',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  postController.updatePost
);

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    删除帖子
 * @access  Private
 */
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  postController.deletePost
);

/**
 * @route   POST /api/v1/posts/:id/like
 * @desc    点赞/取消点赞
 * @access  Private
 */
router.post(
  '/:id/like',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  postController.toggleLike
);

/**
 * @route   POST /api/v1/posts/:id/bookmark
 * @desc    收藏/取消收藏
 * @access  Private
 */
router.post(
  '/:id/bookmark',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  postController.toggleBookmark
);

/**
 * @route   GET /api/v1/posts/:id/comments
 * @desc    获取帖子评论
 * @access  Public
 */
router.get(
  '/:id/comments',
  idParamValidation,
  paginationValidation,
  handleValidationErrors,
  postController.getComments
);

/**
 * @route   POST /api/v1/posts/:id/comments
 * @desc    添加评论
 * @access  Private
 */
router.post(
  '/:id/comments',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  postController.addComment
);

module.exports = router;


// ==================== src/routes/event.js ====================
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { 
  createEventValidation,
  idParamValidation,
  paginationValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   GET /api/v1/events
 * @desc    获取活动列表
 * @access  Public
 */
router.get(
  '/',
  paginationValidation,
  handleValidationErrors,
  eventController.getEvents
);

/**
 * @route   GET /api/v1/events/:id
 * @desc    获取活动详情
 * @access  Public
 */
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  eventController.getEventById
);

/**
 * @route   POST /api/v1/events
 * @desc    创建活动
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  upload.single('cover'),
  createEventValidation,
  handleValidationErrors,
  eventController.createEvent
);

/**
 * @route   PUT /api/v1/events/:id
 * @desc    更新活动
 * @access  Private
 */
router.put(
  '/:id',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.updateEvent
);

/**
 * @route   DELETE /api/v1/events/:id
 * @desc    删除活动
 * @access  Private
 */
router.delete(
  '/:id',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.deleteEvent
);

/**
 * @route   POST /api/v1/events/:id/register
 * @desc    报名活动
 * @access  Private
 */
router.post(
  '/:id/register',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.registerEvent
);

/**
 * @route   DELETE /api/v1/events/:id/register
 * @desc    取消报名
 * @access  Private
 */
router.delete(
  '/:id/register',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.unregisterEvent
);

/**
 * @route   GET /api/v1/events/:id/registrations
 * @desc    获取活动报名列表（仅组织者）
 * @access  Private
 */
router.get(
  '/:id/registrations',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.getRegistrations
);

/**
 * @route   POST /api/v1/events/:id/checkin
 * @desc    活动签到
 * @access  Private
 */
router.post(
  '/:id/checkin',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  eventController.checkIn
);

module.exports = router;


// ==================== src/routes/match.js ====================
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authMiddleware } = require('../middleware/auth');
const { 
  idParamValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   GET /api/v1/match/recommendations
 * @desc    获取推荐好友
 * @access  Private
 */
router.get(
  '/recommendations',
  authMiddleware,
  matchController.getRecommendations
);

/**
 * @route   POST /api/v1/match/connect/:userId
 * @desc    发送好友请求
 * @access  Private
 */
router.post(
  '/connect/:userId',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  matchController.sendConnectionRequest
);

/**
 * @route   POST /api/v1/match/accept/:requestId
 * @desc    接受好友请求
 * @access  Private
 */
router.post(
  '/accept/:requestId',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  matchController.acceptConnection
);

/**
 * @route   POST /api/v1/match/reject/:requestId
 * @desc    拒绝好友请求
 * @access  Private
 */
router.post(
  '/reject/:requestId',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  matchController.rejectConnection
);

/**
 * @route   GET /api/v1/match/connections
 * @desc    获取好友列表
 * @access  Private
 */
router.get(
  '/connections',
  authMiddleware,
  matchController.getConnections
);

/**
 * @route   DELETE /api/v1/match/connections/:userId
 * @desc    删除好友
 * @access  Private
 */
router.delete(
  '/connections/:userId',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  matchController.removeConnection
);

/**
 * @route   GET /api/v1/match/requests
 * @desc    获取好友请求列表
 * @access  Private
 */
router.get(
  '/requests',
  authMiddleware,
  matchController.getConnectionRequests || ((req, res) => {
    res.json({ message: '功能开发中' });
  })
);

module.exports = router;


// ==================== src/routes/ocr.js ====================
const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { ocrLimiter } = require('../middleware/rateLimiter');
const { 
  idParamValidation,
  paginationValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   POST /api/v1/ocr/recognize
 * @desc    识别图片文字
 * @access  Private
 */
router.post(
  '/recognize',
  authMiddleware,
  ocrLimiter,
  upload.single('image'),
  ocrController.recognizeText
);

/**
 * @route   GET /api/v1/ocr/history
 * @desc    获取OCR识别历史
 * @access  Private
 */
router.get(
  '/history',
  authMiddleware,
  paginationValidation,
  handleValidationErrors,
  ocrController.getHistory
);

/**
 * @route   DELETE /api/v1/ocr/history/:id
 * @desc    删除OCR记录
 * @access  Private
 */
router.delete(
  '/history/:id',
  authMiddleware,
  idParamValidation,
  handleValidationErrors,
  ocrController.deleteRecord
);

module.exports = router;
 authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { 
  registerValidation, 
  loginValidation,
  handleValidationErrors 
} = require('../middleware/validator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    获取当前登录用户信息
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    用户登出（可选，前端删除token即可）
 * @access  Private
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: '登出成功' });
});

module.exports = router;


// ==================== src/routes/user.js ====================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const {