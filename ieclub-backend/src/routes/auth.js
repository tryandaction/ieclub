
// ==================== src/routes/auth.js ====================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
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

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    刷新Token（可选功能）
 * @access  Public
 */
router.post('/refresh', (req, res) => {
  // 刷新token逻辑（如果需要的话）
  res.json({ message: '功能待实现' });
});

module.exports = router;