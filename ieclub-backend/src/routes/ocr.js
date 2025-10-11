
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
 * @desc    识别图片文字（支持base64数据）
 * @access  Private
 */
router.post(
  '/recognize',
  authMiddleware,
  ocrLimiter,
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