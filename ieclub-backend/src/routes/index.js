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
const wechatRoutes = require('./wechat');

// 挂载路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/events', eventRoutes);
router.use('/match', matchRoutes);
router.use('/ocr', ocrRoutes);
router.use('/wechat', wechatRoutes);

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
      ocr: '/ocr - OCR识别',
      wechat: '/wechat - 微信小程序相关'
    },
    documentation: 'https://github.com/yourusername/ieclub-backend/blob/main/README.md'
  });
});

// 导出路由
module.exports = router;

