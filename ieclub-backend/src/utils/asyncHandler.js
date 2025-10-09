
// ==================== src/utils/asyncHandler.js ====================
// 异步错误处理包装器（立即可用）

/**
 * 包装异步函数，自动捕获错误
 * 避免每个控制器都写 try-catch
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// 使用方法（在控制器中）：
// const asyncHandler = require('../utils/asyncHandler');
// 
// exports.getUser = asyncHandler(async (req, res) => {
//   const user = await User.findByPk(req.params.id);
//   if (!user) throw new Error('用户不存在');
//   res.json(user);
// });