

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