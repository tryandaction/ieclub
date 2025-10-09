
// ==================== src/utils/validator.js ====================
// 通用验证工具（立即可用）

class Validator {
  /**
   * 验证邮箱
   */
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证南科大邮箱
   */
  static isSustechEmail(email) {
    const domains = ['sustech.edu.cn', 'mail.sustech.edu.cn'];
    return domains.some(domain => email.endsWith(`@${domain}`));
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password) {
    // 至少8位，包含大小写字母和数字
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password);
  }

  /**
   * 验证学号
   */
  static isStudentId(id) {
    // 8位数字
    return /^\d{8}$/.test(id);
  }

  /**
   * 验证URL
   */
  static isURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证手机号
   */
  static isPhoneNumber(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  /**
   * 清理和验证输入
   */
  static sanitize(input, type = 'string') {
    if (input === null || input === undefined) return null;
    
    switch (type) {
      case 'string':
        return String(input).trim();
      case 'number':
        return Number(input);
      case 'boolean':
        return Boolean(input);
      case 'array':
        return Array.isArray(input) ? input : [input];
      default:
        return input;
    }
  }

  /**
   * 批量验证
   */
  static validateFields(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      // 必填检查
      if (rule.required && !value) {
        errors.push({
          field,
          message: `${field}不能为空`
        });
        continue;
      }

      // 类型检查
      if (value && rule.type) {
        if (rule.type === 'email' && !this.isEmail(value)) {
          errors.push({ field, message: '邮箱格式不正确' });
        }
        if (rule.type === 'phone' && !this.isPhoneNumber(value)) {
          errors.push({ field, message: '手机号格式不正确' });
        }
        if (rule.type === 'url' && !this.isURL(value)) {
          errors.push({ field, message: 'URL格式不正确' });
        }
      }

      // 长度检查
      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field}长度至少${rule.minLength}个字符`
        });
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field}长度不能超过${rule.maxLength}个字符`
        });
      }

      // 自定义验证
      if (value && rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({ field, message: customError });
        }
      }
    }

    return errors;
  }
}

module.exports = Validator;

// 使用方法：
// const Validator = require('../utils/validator');
// 
// const rules = {
//   email: { required: true, type: 'email' },
//   password: { required: true, minLength: 8 },
//   username: { required: true, minLength: 3, maxLength: 20 }
// };
// 
// const errors = Validator.validateFields(req.body, rules);
// if (errors.length > 0) {
//   return res.status(400).json({ errors });
// }