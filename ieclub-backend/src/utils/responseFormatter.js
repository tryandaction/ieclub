// ==================== src/utils/responseFormatter.js ====================
// 统一响应格式工具（立即可用）

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {String} message - 提示消息
 * @param {Number} statusCode - HTTP状态码
 */
exports.success = (res, data = null, message = '操作成功', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 * @param {Number} statusCode - HTTP状态码
 * @param {Array} errors - 详细错误信息
 */
exports.error = (res, message = '操作失败', statusCode = 400, errors = null) => {
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} data - 数据列表
 * @param {Number} total - 总数
 * @param {Number} page - 当前页
 * @param {Number} limit - 每页数量
 */
exports.paginate = (res, data, total, page, limit) => {
  res.status(200).json({
    success: true,
    code: 200,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    },
    timestamp: new Date().toISOString()
  });
};

// 在控制器中使用：
// const { success, error, paginate } = require('../utils/responseFormatter');
// return success(res, user, '用户创建成功', 201);
// return error(res, '用户已存在', 400);
// return paginate(res, posts, total, page, limit);