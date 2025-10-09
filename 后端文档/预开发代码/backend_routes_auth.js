const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', registerLimiter, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', authLimiter, authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    刷新Token
 * @access  Private
 */
router.post('/refresh', authMiddleware, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    退出登录
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   POST /api/v1/auth/wechat-login
 * @desc    微信登录
 * @access  Public
 */
router.post('/wechat-login', authController.wechatLogin);

/**
 * @route   POST /api/v1/auth/bind-email
 * @desc    绑定邮箱
 * @access  Public
 */
router.post('/bind-email', authController.bindEmail);

module.exports = router;