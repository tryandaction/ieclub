

// ==================== tests/integration/auth.test.js ====================
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        email: `test${Date.now()}@sustech.edu.cn`,
        password: 'Password123!',
        username: '测试用户',
        studentId: '12012345'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('应该拒绝非南科大邮箱', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@gmail.com',
          password: 'Password123!',
          username: '测试',
          studentId: '12012345'
        })
        .expect(400);

      expect(res.body.message).toContain('邮箱');
    });

    it('应该拒绝重复邮箱', async () => {
      const email = `test${Date.now()}@sustech.edu.cn`;
      
      await User.create({
        email,
        password: 'password',
        username: '用户1',
        studentId: '12012345'
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          username: '用户2',
          studentId: '12012346'
        })
        .expect(400);

      expect(res.body.message).toContain('存在');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser();
    });

    it('应该成功登录', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('应该拒绝错误密码', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body.message).toContain('密码');
    });
  });
});