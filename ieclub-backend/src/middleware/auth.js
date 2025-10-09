const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * 认证中间件 - 验证JWT Token
 * 如果Token无效或不存在，返回401错误
 */
exports.authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取Token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 检查Bearer格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误'
      });
    }

    // 提取Token
    const token = authHeader.substring(7); // 移除 "Bearer "

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    // 验证Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    // JWT验证失败
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '认证过程发生错误'
    });
  }
};

/**
 * 可选认证中间件 - 如果提供Token则验证，不提供也继续
 * 用于那些登录和未登录都能访问，但登录后有额外功能的接口
 * 例如：帖子详情（未登录可看，登录后显示是否点赞）
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 如果没有提供Token，直接继续（不是错误）
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    // 验证Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找用户
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (user) {
      req.user = user;
      req.userId = user.id;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    // Token验证失败也继续（作为未登录用户）
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * 管理员认证中间件 - 验证用户是否为管理员
 * 需要先使用 authMiddleware
 */
exports.adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未认证'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    });
  }

  next();
};

/**
 * 邮箱验证中间件 - 确保用户已验证邮箱
 * 需要先使用 authMiddleware
 */
exports.emailVerifiedMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未认证'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      code: 403,
      message: '请先验证邮箱'
    });
  }

  next();
};

/**
 * 资源所有权验证中间件工厂
 * 验证当前用户是否拥有指定资源
 * 
 * @param {Object} Model - Sequelize模型
 * @param {String} paramName - URL参数名（默认为'id'）
 * @param {String} ownerField - 所有者字段名（默认为'userId'）
 * @returns {Function} 中间件函数
 * 
 * @example
 * router.delete('/:id', authMiddleware, checkOwnership(Post), deletePost);
 */
exports.checkOwnership = (Model, paramName = 'id', ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '未认证'
        });
      }

      const resourceId = req.params[paramName];
      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          code: 404,
          message: '资源不存在'
        });
      }

      if (resource[ownerField] !== req.user.id) {
        return res.status(403).json({
          code: 403,
          message: '无权限操作此资源'
        });
      }

      // 将资源附加到请求对象，避免重复查询
      req.resource = resource;

      next();
    } catch (error) {
      console.error('所有权验证错误:', error);
      return res.status(500).json({
        code: 500,
        message: '验证权限时发生错误'
      });
    }
  };
};

/**
 * Token刷新中间件
 * 用于刷新即将过期的Token
 */
exports.refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        message: '未提供刷新令牌'
      });
    }

    // 验证刷新Token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // 查找用户
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    // 生成新的访问Token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: '令牌刷新成功',
      token: newAccessToken,
      user: user
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '刷新令牌无效或已过期'
      });
    }

    console.error('刷新令牌错误:', error);
    return res.status(500).json({
      code: 500,
      message: '刷新令牌时发生错误'
    });
  }
};