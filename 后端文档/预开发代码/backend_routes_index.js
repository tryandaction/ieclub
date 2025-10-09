const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth.routes');
// 其他路由将在后续添加
// const userRoutes = require('./user.routes');
// const postRoutes = require('./post.routes');
// const eventRoutes = require('./event.routes');

// 挂载路由
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);
// router.use('/events', eventRoutes);

// API信息接口
router.get('/', (req, res) => {
  res.json({
    message: 'IEclub API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users (coming soon)',
      posts: '/posts (coming soon)',
      events: '/events (coming soon)'
    }
  });
});

module.exports = router;