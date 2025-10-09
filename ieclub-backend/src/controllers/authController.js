const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateEmail, validatePassword, validateFields } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * 生成JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * 格式化用户信息（移除敏感数据）
 */
const formatUserResponse = (user) => {
  const userData = user.toJSON();
  delete userData.passwordHash;
  delete userData.wechatOpenid;
  return userData;
};

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, department, major, grade, interests, skills } = req.body;

    // 验证必填字段
    const validation = validateFields(req.body, {
      username: { required: true, type: 'username' },
      email: { required: true, type: 'email' },
      password: { required: true, type: 'password' },
      department: { required: false },
      major: { required: false },
      grade: { required: false }
    });

    if (!validation.isValid) {
      return res.status(400).json({
        code: 400,
        message: '数据验证失败',
        errors: Object.entries(validation.errors).map(([field, message]) => ({
          field,
          message
        }))
      });
    }

    // 检查邮箱是否已被注册
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '该邮箱已被注册'
      });
    }

    // 检查用户名是否已被使用
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        code: 409,
        message: '该用户名已被使用'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash: password, // 会在模型的beforeCreate hook中自动加密
      department,
      major,
      grade,
      interests: interests || [],
      skills: skills || [],
      school: '南方科技大学'
    });

    // 生成token
    const token = generateToken(user.id);

    // 记录日志
    logger.info(`新用户注册成功: ${user.email} (ID: ${user.id})`);

    // 返回用户信息
    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });
  } catch (error) {
    logger.error('注册失败:', error);
    next(error);
  }
};

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '邮箱和密码不能为空'
      });
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        message: '请使用南科大邮箱登录'
      });
    }

    // 查找用户
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    await user.update({ lastLogin: new Date() });

    // 生成token
    const token = generateToken(user.id);

    // 记录日志
    logger.info(`用户登录: ${user.email} (ID: ${user.id})`);

    // 返回用户信息
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    next(error);
  }
};

/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // req.user 由 auth 中间件设置
    const user = req.user;

    res.json({
      code: 200,
      message: 'success',
      data: formatUserResponse(user)
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    next(error);
  }
};

/**
 * 刷新Token
 * POST /api/v1/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const userId = req.userId;

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 生成新token
    const token = generateToken(user.id);

    res.json({
      code: 200,
      message: 'Token刷新成功',
      data: { token }
    });
  } catch (error) {
    logger.error('Token刷新失败:', error);
    next(error);
  }
};

/**
 * 微信登录
 * POST /api/v1/auth/wechat-login
 */
exports.wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少微信登录code'
      });
    }

    // TODO: 调用微信API获取openid
    // 这里需要配置微信小程序的appid和secret
    // const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    //   params: {
    //     appid: process.env.WECHAT_APPID,
    //     secret: process.env.WECHAT_SECRET,
    //     js_code: code,
    //     grant_type: 'authorization_code'
    //   }
    // });
    // const { openid } = wxResponse.data;

    // 临时模拟（实际开发中需要替换）
    const openid = 'mock_openid_' + Date.now();

    // 查找用户
    let user = await User.findOne({ where: { wechatOpenid: openid } });

    if (!user) {
      // 新用户，需要绑定邮箱
      return res.json({
        code: 200,
        message: '需要绑定邮箱',
        data: {
          needBind: true,
          openid: openid
        }
      });
    }

    // 老用户，直接登录
    await user.update({ lastLogin: new Date() });
    const token = generateToken(user.id);

    logger.info(`微信登录: ${user.email} (ID: ${user.id})`);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });
  } catch (error) {
    logger.error('微信登录失败:', error);
    next(error);
  }
};

/**
 * 绑定邮箱
 * POST /api/v1/auth/bind-email
 */
exports.bindEmail = async (req, res, next) => {
  try {
    const { openid, email, password, username, department, major, grade } = req.body;

    // 验证必填字段
    const validation = validateFields(req.body, {
      openid: { required: true },
      username: { required: true, type: 'username' },
      email: { required: true, type: 'email' },
      password: { required: true, type: 'password' }
    });

    if (!validation.isValid) {
      return res.status(400).json({
        code: 400,
        message: '数据验证失败',
        errors: Object.entries(validation.errors).map(([field, message]) => ({
          field,
          message
        }))
      });
    }

    // 检查邮箱是否已被注册
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '该邮箱已被注册'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash: password,
      wechatOpenid: openid,
      department,
      major,
      grade,
      school: '南方科技大学'
    });

    // 生成token
    const token = generateToken(user.id);

    logger.info(`微信绑定邮箱成功: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      code: 201,
      message: '绑定成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });
  } catch (error) {
    logger.error('绑定邮箱失败:', error);
    next(error);
  }
};

/**
 * 退出登录
 * POST /api/v1/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // JWT是无状态的，客户端删除token即可
    // 如果使用Redis存储token黑名单，可以在这里添加
    
    logger.info(`用户退出登录: ${req.user.email} (ID: ${req.user.id})`);

    res.json({
      code: 200,
      message: '退出登录成功'
    });
  } catch (error) {
    logger.error('退出登录失败:', error);
    next(error);
  }
};