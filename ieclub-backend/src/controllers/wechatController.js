const axios = require('axios');
const crypto = require('crypto');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * 生成微信小程序登录签名
 */
const generateWechatSignature = (timestamp, nonceStr, jsapiTicket) => {
  const str = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${process.env.FRONTEND_URL}`;
  return crypto.createHash('sha1').update(str).digest('hex');
};

/**
 * 获取微信小程序access_token
 */
const getWechatAccessToken = async () => {
  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WECHAT_MINIPROGRAM_APPID,
        secret: process.env.WECHAT_MINIPROGRAM_SECRET
      }
    });
    return response.data.access_token;
  } catch (error) {
    logger.error('获取微信access_token失败:', error);
    throw new Error('获取微信凭证失败');
  }
};

/**
 * 获取微信小程序jsapi_ticket
 */
const getWechatJsapiTicket = async (accessToken) => {
  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket', {
      params: {
        access_token: accessToken,
        type: 'jsapi'
      }
    });
    return response.data.ticket;
  } catch (error) {
    logger.error('获取微信jsapi_ticket失败:', error);
    throw new Error('获取微信票据失败');
  }
};

/**
 * 小程序微信登录
 * POST /api/v1/wechat/miniprogram-login
 */
exports.miniprogramLogin = async (req, res) => {
  try {
    const { code, userInfo, encryptedData, iv } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '缺少微信登录code'
      });
    }

    // 调用微信API获取openid和session_key
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_MINIPROGRAM_APPID,
        secret: process.env.WECHAT_MINIPROGRAM_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (response.data.errcode) {
      logger.error('微信登录失败:', response.data);
      return res.status(400).json({
        code: 400,
        message: '微信登录失败',
        error: response.data.errmsg
      });
    }

    const { openid, session_key, unionid } = response.data;

    // 查找用户
    let user = await User.findOne({
      where: { wechatOpenid: openid }
    });

    if (!user) {
      // 新用户，需要绑定信息
      return res.json({
        code: 200,
        message: '需要完善信息',
        data: {
          needRegister: true,
          openid: openid,
          sessionKey: session_key
        }
      });
    }

    // 老用户，直接登录
    await user.update({ lastLogin: new Date() });

    // 生成JWT token（复用现有的token生成逻辑）
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`小程序微信登录成功: ${user.email} (ID: ${user.id})`);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });

  } catch (error) {
    logger.error('小程序微信登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败',
      error: error.message
    });
  }
};

/**
 * 小程序注册（完善用户信息）
 * POST /api/v1/wechat/miniprogram-register
 */
exports.miniprogramRegister = async (req, res) => {
  try {
    const {
      openid,
      sessionKey,
      userInfo,
      encryptedData,
      iv
    } = req.body;

    // 验证必填字段
    if (!openid || !userInfo) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要信息'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: { wechatOpenid: openid }
    });

    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户已存在'
      });
    }

    // 创建用户
    const user = await User.create({
      username: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      wechatOpenid: openid,
      school: '南方科技大学',
      department: null, // 用户可以后续完善
      major: null,
      grade: null,
      bio: `微信用户：${userInfo.nickName}`,
      isVerified: false
    });

    // 生成token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`小程序新用户注册成功: ${user.username} (ID: ${user.id})`);

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user: formatUserResponse(user),
        token
      }
    });

  } catch (error) {
    logger.error('小程序注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '注册失败',
      error: error.message
    });
  }
};

/**
 * 获取微信小程序配置（用于分享等功能）
 * GET /api/v1/wechat/config
 */
exports.getWechatConfig = async (req, res) => {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        code: 400,
        message: '缺少url参数'
      });
    }

    // 获取access_token和jsapi_ticket
    const accessToken = await getWechatAccessToken();
    const jsapiTicket = await getWechatJsapiTicket(accessToken);

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = Math.random().toString(36).substr(2, 15);
    const signature = generateWechatSignature(timestamp, nonceStr, jsapiTicket);

    res.json({
      code: 200,
      data: {
        appId: process.env.WECHAT_MINIPROGRAM_APPID,
        timestamp: timestamp,
        nonceStr: nonceStr,
        signature: signature,
        jsapiTicket: jsapiTicket
      }
    });

  } catch (error) {
    logger.error('获取微信配置失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取配置失败',
      error: error.message
    });
  }
};

/**
 * 小程序支付统一下单
 * POST /api/v1/wechat/payment
 */
exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        code: 400,
        message: '缺少订单信息'
      });
    }

    // 这里需要集成微信支付SDK
    // 以下是示例代码，实际需要根据微信支付文档实现

    // 生成商户订单号
    const outTradeNo = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 调用微信支付统一下单API
    const paymentData = {
      appid: process.env.WECHAT_MINIPROGRAM_APPID,
      mch_id: process.env.WECHAT_MCH_ID,
      nonce_str: generateNonce(),
      body: description || 'IEclub服务',
      out_trade_no: outTradeNo,
      total_fee: Math.round(amount * 100), // 微信支付以分为单位
      spbill_create_ip: req.ip || '127.0.0.1',
      notify_url: `${process.env.FRONTEND_URL}/api/wechat/payment/notify`,
      trade_type: 'JSAPI',
      openid: req.user.wechatOpenid
    };

    // 计算签名（需要实现微信支付签名算法）
    const sign = generatePaymentSign(paymentData);
    paymentData.sign = sign;

    // 发送统一下单请求
    const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', paymentData, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

    // 解析响应（XML格式）
    // 这里需要XML解析，实际项目中可以使用xml2js库

    res.json({
      code: 200,
      message: '支付创建成功',
      data: {
        payment: response.data
      }
    });

  } catch (error) {
    logger.error('小程序支付创建失败:', error);
    res.status(500).json({
      code: 500,
      message: '支付创建失败',
      error: error.message
    });
  }
};

/**
 * 小程序支付回调通知
 * POST /api/v1/wechat/payment/notify
 */
exports.paymentNotify = async (req, res) => {
  try {
    // 微信支付回调通知处理
    // 需要验证签名，更新订单状态等

    logger.info('收到微信支付回调:', req.body);

    // 处理支付成功逻辑
    // 1. 验证签名
    // 2. 更新订单状态
    // 3. 给用户发放权益

    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');

  } catch (error) {
    logger.error('支付回调处理失败:', error);
    res.status(500).send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[ERROR]]></return_msg></xml>');
  }
};

/**
 * 生成微信支付签名
 */
const generatePaymentSign = (data) => {
  // 微信支付签名算法
  const string = Object.keys(data)
    .filter(key => key !== 'sign' && data[key] !== '')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&') + `&key=${process.env.WECHAT_PAY_KEY}`;

  return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
};

/**
 * 生成随机字符串
 */
const generateNonce = () => {
  return Math.random().toString(36).substr(2, 15) +
         Math.random().toString(36).substr(2, 15);
};

/**
 * 格式化用户信息（复用认证控制器的函数）
 */
const formatUserResponse = (user) => {
  const userData = user.toJSON();
  delete userData.passwordHash;
  delete userData.wechatOpenid;
  return userData;
};