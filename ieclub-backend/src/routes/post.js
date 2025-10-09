

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

