const express = require('express');
const router = express.Router();
const wechatController = require('../controllers/wechatController');
const { authMiddleware } = require('../middleware/auth');

/**
 * 微信小程序相关路由
 */

// 小程序微信登录
router.post('/miniprogram-login', wechatController.miniprogramLogin);

// 小程序注册（完善用户信息）
router.post('/miniprogram-register', wechatController.miniprogramRegister);

// 获取微信小程序配置（用于分享等功能）
router.get('/config', wechatController.getWechatConfig);

// 小程序支付统一下单（需要登录）
router.post('/payment', authMiddleware, wechatController.createPayment);

// 小程序支付回调通知（不需要登录，由微信服务器调用）
router.post('/payment/notify', wechatController.paymentNotify);

module.exports = router;