const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
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