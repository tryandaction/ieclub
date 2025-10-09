// ==================== tests/setup.js ====================
/**
 * Jest测试环境配置
 */
const { sequelize } = require('../src/models');

// 测试前初始化
beforeAll(async () => {
  // 连接测试数据库
  await sequelize.authenticate();
  
  // 同步数据库模型
  await sequelize.sync({ force: true });
  
  console.log('测试数据库已初始化');
});

// 每个测试后清理
afterEach(async () => {
  // 清理测试数据（可选）
});

// 所有测试完成后
afterAll(async () => {
  // 关闭数据库连接
  await sequelize.close();
  console.log('测试数据库连接已关闭');
});

// 全局测试工具
global.testHelpers = {
  // 创建测试用户
  createTestUser: async (userData = {}) => {
    const { User } = require('../src/models');
    return await User.create({
      email: `test${Date.now()}@sustech.edu.cn`,
      password: 'password123',
      username: '测试用户',
      studentId: '12012345',
      ...userData
    });
  },
  
  // 生成测试Token
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};