
// ========== middleware/validator.js ==========
const { body, param, query, validationResult } = require('express-validator');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');

/**
 * 验证结果处理
 */
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * 注册验证规则
 */
exports.registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确')
    .custom(validateEmail).withMessage('仅支持南科大邮箱'),
  body('password')
    .custom(validatePassword).withMessage('密码至少8位'),
  body('username')
    .trim()
    .custom(validateUsername).withMessage('用户名长度应在3-20位之间'),
  body('studentId')
    .trim()
    .matches(/^\d{8}$/).withMessage('学号格式不正确（8位数字）')
];

/**
 * 登录验证规则
 */
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
];

/**
 * 创建帖子验证规则
 */
exports.createPostValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('标题长度应在1-200字之间'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 }).withMessage('内容长度应在1-10000字之间'),
  body('category')
    .trim()
    .isIn(['学术', '生活', '活动', '求助', '分享', '其他']).withMessage('分类不正确')
];

/**
 * 创建活动验证规则
 */
exports.createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('标题长度应在1-200字之间'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('描述长度应在1-5000字之间'),
  body('location')
    .trim()
    .notEmpty().withMessage('地点不能为空'),
  body('startTime')
    .isISO8601().withMessage('开始时间格式不正确')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('开始时间必须在未来');
      }
      return true;
    }),
  body('endTime')
    .isISO8601().withMessage('结束时间格式不正确')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('结束时间必须在开始时间之后');
      }
      return true;
    }),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('参与人数应在1-1000之间')
];

/**
 * 更新用户信息验证规则
 */
exports.updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .custom(validateUsername).withMessage('用户名长度应在3-20位之间'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('个人简介不能超过500字'),
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('专业名称过长'),
  body('grade')
    .optional()
    .trim()
    .matches(/^\d{4}$/).withMessage('年级格式不正确（4位数字）')
];

/**
 * ID参数验证
 */
exports.idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID必须是正整数')
];

/**
 * 分页参数验证
 */
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量应在1-100之间')
];