
// ==================== src/config/constants.js ====================
// 常量配置（立即可用）

module.exports = {
  // 用户角色
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },

  // 帖子分类
  POST_CATEGORIES: {
    ACADEMIC: '学术',
    LIFE: '生活',
    EVENT: '活动',
    HELP: '求助',
    SHARE: '分享',
    OTHER: '其他'
  },

  // 活动状态
  EVENT_STATUS: {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // 好友请求状态
  CONNECTION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
  },

  // 文件上传限制
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 9,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
  },

  // 分页默认值
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // 缓存时间（秒）
  CACHE_TTL: {
    SHORT: 60,        // 1分钟
    MEDIUM: 300,      // 5分钟
    LONG: 3600,       // 1小时
    VERY_LONG: 86400  // 1天
  },

  // 错误消息
  ERROR_MESSAGES: {
    UNAUTHORIZED: '未授权，请先登录',
    FORBIDDEN: '没有权限执行此操作',
    NOT_FOUND: '请求的资源不存在',
    VALIDATION_ERROR: '数据验证失败',
    SERVER_ERROR: '服务器内部错误'
  },

  // 成功消息
  SUCCESS_MESSAGES: {
    CREATED: '创建成功',
    UPDATED: '更新成功',
    DELETED: '删除成功',
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '登出成功'
  }
};

// 使用方法：
// const { POST_CATEGORIES, ERROR_MESSAGES } = require('../config/constants');
// if (!POST_CATEGORIES[category]) {
//   return res.status(400).json({ message: '无效的分类' });
// }