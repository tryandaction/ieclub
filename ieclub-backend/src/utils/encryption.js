// ==================== src/utils/encryption.js ====================
const crypto = require('crypto');

/**
 * 数据加密工具类
 */
class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltLength = 64;
    this.tagLength = 16;
    this.iterations = 100000;
    
    // 从环境变量获取主密钥
    this.masterKey = process.env.ENCRYPTION_KEY || this.generateKey();
  }

  /**
   * 生成随机密钥
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * 生成随机IV
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * 生成随机盐
   */
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  /**
   * 派生密钥
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha512'
    );
  }

  /**
   * AES-256-GCM加密
   */
  encrypt(text) {
    try {
      const iv = this.generateIV();
      const salt = this.generateSalt();
      const key = this.deriveKey(this.masterKey, salt);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // 返回格式: salt:iv:tag:encrypted
      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])
        .toString('base64');
    } catch (error) {
      throw new Error('加密失败: ' + error.message);
    }
  }

  /**
   * AES-256-GCM解密
   */
  decrypt(encryptedData) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.slice(0, this.saltLength);
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = buffer.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = buffer.slice(this.saltLength + this.ivLength + this.tagLength);
      
      const key = this.deriveKey(this.masterKey, salt);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('解密失败: ' + error.message);
    }
  }

  /**
   * 哈希密码
   */
  async hashPassword(password) {
    const salt = this.generateSalt();
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      64,
      'sha512'
    );
    
    return Buffer.concat([salt, hash]).toString('base64');
  }

  /**
   * 验证密码
   */
  async verifyPassword(password, hashedPassword) {
    try {
      const buffer = Buffer.from(hashedPassword, 'base64');
      const salt = buffer.slice(0, this.saltLength);
      const originalHash = buffer.slice(this.saltLength);
      
      const hash = crypto.pbkdf2Sync(
        password,
        salt,
        this.iterations,
        64,
        'sha512'
      );
      
      return crypto.timingSafeEqual(hash, originalHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成安全token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * HMAC签名
   */
  sign(data, secret = this.masterKey) {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * 验证HMAC签名
   */
  verifySignature(data, signature, secret = this.masterKey) {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * 加密敏感字段
   */
  encryptObject(obj, fields = []) {
    const encrypted = { ...obj };
    
    fields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field].toString());
      }
    });
    
    return encrypted;
  }

  /**
   * 解密敏感字段
   */
  decryptObject(obj, fields = []) {
    const decrypted = { ...obj };
    
    fields.forEach(field => {
      if (decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          // 解密失败，保持原值
        }
      }
    });
    
    return decrypted;
  }

  /**
   * 生成API密钥对
   */
  generateApiKeyPair() {
    const apiKey = this.generateToken(32);
    const apiSecret = this.generateToken(64);
    const hashedSecret = this.sign(apiSecret);
    
    return {
      apiKey,
      apiSecret,
      hashedSecret
    };
  }
}

module.exports = new Encryption();