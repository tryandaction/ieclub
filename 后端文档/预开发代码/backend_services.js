// ========== services/uploadService.js ==========
const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs').promises;

// 初始化OSS客户端
const client = new OSS({
  region: process.env.ALI_OSS_REGION,
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALI_OSS_BUCKET
});

/**
 * 上传文件到阿里云OSS
 * @param {Object} file - Multer文件对象
 * @param {String} folder - 存储文件夹
 * @returns {String} 文件URL
 */
exports.uploadToOSS = async (file, folder = 'uploads') => {
  try {
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    const result = await client.put(fileName, file.path);
    
    // 删除本地临时文件
    await fs.unlink(file.path);
    
    return result.url;
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error('文件上传失败');
  }
};

/**
 * 删除OSS文件
 * @param {String} fileUrl - 文件URL
 */
exports.deleteFromOSS = async (fileUrl) => {
  try {
    const fileName = fileUrl.split('.com/')[1];
    await client.delete(fileName);
  } catch (error) {
    console.error('OSS删除失败:', error);
  }
};

/**
 * 批量上传文件
 * @param {Array} files - 文件数组
 * @param {String} folder - 存储文件夹
 * @returns {Array} 文件URL数组
 */
exports.uploadMultipleToOSS = async (files, folder = 'uploads') => {
  return Promise.all(files.map(file => exports.uploadToOSS(file, folder)));
};


// ========== services/ocrService.js ==========
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * 百度OCR - 获取Access Token
 */
const getBaiduAccessToken = async () => {
  try {
    const response = await axios.get('https://aip.baidubce.com/oauth/2.0/token', {
      params: {
        grant_type: 'client_credentials',
        client_id: process.env.BAIDU_OCR_API_KEY,
        client_secret: process.env.BAIDU_OCR_SECRET_KEY
      }
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('获取百度OCR Token失败');
  }
};

/**
 * 识别图片中的文字
 * @param {String} imagePath - 图片路径
 * @returns {Object} 识别结果
 */
exports.recognizeText = async (imagePath) => {
  try {
    const accessToken = await getBaiduAccessToken();
    
    // 读取图片并转为base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // 调用百度OCR API
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      `image=${encodeURIComponent(imageBase64)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.words_result) {
      const text = response.data.words_result
        .map(item => item.words)
        .join('\n');
      
      return {
        text,
        confidence: response.data.words_result[0]?.probability || 0,
        wordsCount: response.data.words_result_num,
        language: 'CHN_ENG'
      };
    }
    
    throw new Error('OCR识别失败');
  } catch (error) {
    console.error('OCR识别错误:', error);
    throw new Error('文字识别失败');
  }
};

/**
 * 高精度OCR识别（用于PPT等场景）
 */
exports.recognizeAccurateText = async (imagePath) => {
  try {
    const accessToken = await getBaiduAccessToken();
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
      `image=${encodeURIComponent(imageBase64)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.words_result) {
      const text = response.data.words_result
        .map(item => item.words)
        .join('\n');
      
      return {
        text,
        confidence: response.data.words_result[0]?.probability || 0,
        wordsCount: response.data.words_result_num,
        language: 'CHN_ENG'
      };
    }
    
    throw new Error('OCR识别失败');
  } catch (error) {
    console.error('高精度OCR错误:', error);
    throw new Error('文字识别失败');
  }
};


// ========== services/matchService.js ==========
const { User, UserConnection } = require('../models');
const { Op } = require('sequelize');

/**
 * 计算两个用户的兴趣匹配度
 * @param {Array} interests1 - 用户1的兴趣
 * @param {Array} interests2 - 用户2的兴趣
 * @returns {Number} 匹配度 (0-1)
 */
const calculateInterestMatch = (interests1, interests2) => {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0;
  }
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return intersection / union; // Jaccard相似度
};

/**
 * 计算技能匹配度
 */
const calculateSkillMatch = (skills1, skills2) => {
  return calculateInterestMatch(skills1, skills2);
};

/**
 * 获取用户的推荐好友
 * @param {Number} userId - 用户ID
 * @param {Number} limit - 推荐数量
 * @returns {Array} 推荐用户列表
 */
exports.getRecommendations = async (userId, limit = 10) => {
  try {
    const currentUser = await User.findByPk(userId);
    if (!currentUser) {
      throw new Error('用户不存在');
    }
    
    // 获取已连接的好友ID
    const connections = await UserConnection.findAll({
      where: {
        [Op.or]: [
          { userId: userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      }
    });
    
    const connectedIds = connections.map(conn => 
      conn.userId === userId ? conn.friendId : conn.userId
    );
    
    // 获取所有其他用户（排除自己和已连接的）
    const candidates = await User.findAll({
      where: {
        id: {
          [Op.notIn]: [userId, ...connectedIds]
        }
      },
      attributes: ['id', 'username', 'avatar', 'bio', 'major', 'grade', 'interests', 'skills'],
      limit: 100 // 先获取较多候选人
    });
    
    // 计算匹配度
    const recommendations = candidates.map(candidate => {
      const interestScore = calculateInterestMatch(
        currentUser.interests,
        candidate.interests
      );
      
      const skillScore = calculateSkillMatch(
        currentUser.skills,
        candidate.skills
      );
      
      // 同专业加分
      const majorBonus = currentUser.major === candidate.major ? 0.2 : 0;
      
      // 同年级加分
      const gradeBonus = currentUser.grade === candidate.grade ? 0.1 : 0;
      
      // 综合评分
      const matchScore = (
        interestScore * 0.4 +
        skillScore * 0.3 +
        majorBonus +
        gradeBonus
      );
      
      // 计算共同兴趣
      const commonInterests = currentUser.interests?.filter(i => 
        candidate.interests?.some(ci => ci.toLowerCase() === i.toLowerCase())
      ) || [];
      
      const commonSkills = currentUser.skills?.filter(s => 
        candidate.skills?.some(cs => cs.toLowerCase() === s.toLowerCase())
      ) || [];
      
      return {
        user: candidate,
        matchScore,
        commonInterests,
        commonSkills,
        sameMajor: currentUser.major === candidate.major,
        sameGrade: currentUser.grade === candidate.grade
      };
    });
    
    // 按匹配度排序并返回前N个
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('获取推荐失败:', error);
    throw error;
  }
};


// ========== services/emailService.js ==========
const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * 发送验证邮件
 */
exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'IEclub - 邮箱验证',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">欢迎加入 IE Club！</h2>
        <p>请点击下面的链接验证您的邮箱：</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          验证邮箱
        </a>
        <p>或复制以下链接到浏览器：</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          此链接24小时内有效。如果您没有注册 IE Club，请忽略此邮件。
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

/**
 * 发送密码重置邮件
 */
exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'IEclub - 重置密码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">重置密码</h2>
        <p>您请求重置密码。请点击下面的链接：</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          重置密码
        </a>
        <p>或复制以下链接到浏览器：</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          此链接1小时内有效。如果您没有请求重置密码，请忽略此邮件。
        </p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

/**
 * 发送活动提醒邮件
 */
exports.sendEventReminderEmail = async (email, event) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `IEclub - 活动提醒: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">活动即将开始</h2>
        <h3>${event.title}</h3>
        <p><strong>时间：</strong>${new Date(event.startTime).toLocaleString('zh-CN')}</p>
        <p><strong>地点：</strong>${event.location}</p>
        <p><strong>描述：</strong>${event.description}</p>
        <a href="${process.env.FRONTEND_URL}/events/${event.id}" 
           style="display: inline-block; padding: 12px 24px; background-color: #6366f1; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          查看详情
        </a>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};
