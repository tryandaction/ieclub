
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