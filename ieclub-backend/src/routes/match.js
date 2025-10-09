
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
