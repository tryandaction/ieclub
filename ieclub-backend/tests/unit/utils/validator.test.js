
// ==================== tests/unit/utils/validator.test.js ====================
const Validator = require('../../../src/utils/validator');

describe('Validator Utils', () => {
  describe('isEmail', () => {
    it('应该验证有效邮箱', () => {
      expect(Validator.isEmail('test@sustech.edu.cn')).toBe(true);
      expect(Validator.isEmail('user@mail.sustech.edu.cn')).toBe(true);
    });

    it('应该拒绝无效邮箱', () => {
      expect(Validator.isEmail('invalid')).toBe(false);
      expect(Validator.isEmail('test@')).toBe(false);
      expect(Validator.isEmail('@sustech.edu.cn')).toBe(false);
    });
  });

  describe('validateFields', () => {
    it('应该验证所有字段', () => {
      const data = {
        email: 'test@sustech.edu.cn',
        password: 'Password123!',
        username: '测试用户'
      };

      const rules = {
        email: { required: true, type: 'email' },
        password: { required: true, minLength: 8 },
        username: { required: true, minLength: 2, maxLength: 20 }
      };

      const errors = Validator.validateFields(data, rules);
      expect(errors).toHaveLength(0);
    });

    it('应该返回验证错误', () => {
      const data = {
        email: 'invalid',
        password: '123',
        username: 'a'
      };

      const rules = {
        email: { required: true, type: 'email' },
        password: { required: true, minLength: 8 },
        username: { required: true, minLength: 2 }
      };

      const errors = Validator.validateFields(data, rules);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});