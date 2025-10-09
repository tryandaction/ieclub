// ==================== src/utils/inputSanitizer.js ====================
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

/**
 * 输入清理工具
 */
class InputSanitizer {
  /**
   * 清理HTML（防XSS）
   */
  static sanitizeHtml(html) {
    if (!html) return '';
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
    });
  }

  /**
   * 清理字符串（移除特殊字符）
   */
  static sanitizeString(str) {
    if (!str) return '';
    
    return validator.escape(
      str.toString()
        .trim()
        .replace(/[<>]/g, '')
    );
  }

  /**
   * 验证并清理邮箱
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    
    const normalized = validator.normalizeEmail(email);
    return validator.isEmail(normalized) ? normalized : '';
  }

  /**
   * 验证并清理URL
   */
  static sanitizeUrl(url) {
    if (!url) return '';
    
    const trimmed = url.trim();
    if (validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      return trimmed;
    }
    
    return '';
  }

  /**
   * 清理文件名
   */
  static sanitizeFilename(filename) {
    if (!filename) return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }

  /**
   * 清理路径（防止路径遍历）
   */
  static sanitizePath(path) {
    if (!path) return '';
    
    return path
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/\/+/g, '/');
  }

  /**
   * 清理用户输入对象
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'object') {
      return input;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * 验证和清理Markdown
   */
  static sanitizeMarkdown(markdown) {
    if (!markdown) return '';
    
    // 移除危险的Markdown语法
    return markdown
      .replace(/!\[.*?\]\(javascript:.*?\)/gi, '')
      .replace(/<script.*?>.*?<\/script>/gis, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * 批量清理
   */
  static sanitizeBatch(data, rules) {
    const sanitized = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      if (data[field] === undefined) continue;
      
      switch (rule) {
        case 'string':
          sanitized[field] = this.sanitizeString(data[field]);
          break;
        case 'email':
          sanitized[field] = this.sanitizeEmail(data[field]);
          break;
        case 'url':
          sanitized[field] = this.sanitizeUrl(data[field]);
          break;
        case 'html':
          sanitized[field] = this.sanitizeHtml(data[field]);
          break;
        case 'markdown':
          sanitized[field] = this.sanitizeMarkdown(data[field]);
          break;
        default:
          sanitized[field] = data[field];
      }
    }
    
    return sanitized;
  }
}

module.exports = InputSanitizer;