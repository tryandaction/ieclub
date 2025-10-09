// ==================== src/controllers/userController.js ====================
const { User, Post, Event, sequelize } = require('../models');
const { Op } = require('sequelize');
const { uploadToOSS } = require('../services/uploadService');

/**
 * 获取用户详细信息
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await User.findByPk(userId, {
      attributes: { 
        exclude: ['password', 'createdAt', 'updatedAt'] 
      },
      include: [
        {
          model: Post,
          as: 'posts',
          limit: 5,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'title', 'category', 'likeCount', 'commentCount', 'createdAt']
        },
        {
          model: Event,
          as: 'organizedEvents',
          limit: 5,
          order: [['startTime', 'DESC']],
          attributes: ['id', 'title', 'startTime', 'location', 'participantCount']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ 
        code: 404,
        message: '用户不存在' 
      });
    }

    // 统计信息
    const stats = {
      postsCount: await Post.count({ where: { userId: userId } }),
      eventsCount: await Event.count({ where: { organizerId: userId } }),
      // 可以添加更多统计信息
    };

    res.json({
      user: user.toJSON(),
      stats
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取用户信息失败', 
      error: error.message 
    });
  }
};

/**
 * 更新个人信息
 */
exports.updateProfile = async (req, res) => {
  try {
    const { 
      username, 
      bio, 
      major, 
      grade, 
      interests, 
      skills, 
      homepage,
      githubUrl,
      wechatId
    } = req.body;
    
    // 构建更新对象（只更新提供的字段）
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (major !== undefined) updateData.major = major;
    if (grade !== undefined) updateData.grade = grade;
    if (interests !== undefined) updateData.interests = interests;
    if (skills !== undefined) updateData.skills = skills;
    if (homepage !== undefined) updateData.homepage = homepage;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (wechatId !== undefined) updateData.wechatId = wechatId;

    await req.user.update(updateData);

    // 返回更新后的用户信息（不包含密码）
    const updatedUser = req.user.toJSON();
    delete updatedUser.password;

    res.json({ 
      message: '更新成功', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('更新个人信息失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '更新失败', 
      error: error.message 
    });
  }
};

/**
 * 上传头像
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        code: 400,
        message: '请上传图片' 
      });
    }

    // 上传到OSS或本地
    const avatarUrl = await uploadToOSS(req.file, 'avatars');
    
    // 更新用户头像
    await req.user.update({ avatar: avatarUrl });

    res.json({ 
      message: '头像上传成功', 
      avatar: avatarUrl 
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '上传失败', 
      error: error.message 
    });
  }
};

/**
 * 更新个人主页内容
 */
exports.updateHomepage = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        code: 400,
        message: '主页内容不能为空' 
      });
    }

    await req.user.update({ homepage: content });
    
    res.json({ 
      message: '个人主页更新成功',
      homepage: content
    });
  } catch (error) {
    console.error('更新主页失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '更新失败', 
      error: error.message 
    });
  }
};

/**
 * 获取用户发布的帖子
 */
exports.getUserPosts = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await Post.findAndCountAll({
      where: { userId: userId },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.rows,
      total: posts.count,
      page: parseInt(page),
      totalPages: Math.ceil(posts.count / limit)
    });
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};

/**
 * 获取用户组织的活动
 */
exports.getUserEvents = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { organizerId: userId };
    
    // 根据状态筛选
    const now = new Date();
    if (status === 'upcoming') {
      where.startTime = { [Op.gt]: now };
    } else if (status === 'past') {
      where.endTime = { [Op.lt]: now };
    }

    const events = await Event.findAndCountAll({
      where,
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      events: events.rows,
      total: events.count,
      page: parseInt(page),
      totalPages: Math.ceil(events.count / limit)
    });
  } catch (error) {
    console.error('获取用户活动失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};

/**
 * 搜索用户
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q, major, grade, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // 关键词搜索（用户名或简介）
    if (q) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // 专业筛选
    if (major) {
      where.major = major;
    }

    // 年级筛选
    if (grade) {
      where.grade = grade;
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { 
        exclude: ['password', 'createdAt', 'updatedAt'] 
      },
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '搜索失败', 
      error: error.message 
    });
  }
};

/**
 * 获取热门用户（根据活跃度排序）
 */
exports.getPopularUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // 使用原生SQL查询，按帖子数和活动数排序
    const users = await sequelize.query(`
      SELECT 
        u.id, u.username, u.avatar, u.bio, u.major, u.grade,
        COUNT(DISTINCT p.id) as posts_count,
        COUNT(DISTINCT e.id) as events_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN events e ON u.id = e.organizer_id
      GROUP BY u.id
      ORDER BY (COUNT(DISTINCT p.id) + COUNT(DISTINCT e.id)) DESC
      LIMIT :limit
    `, {
      replacements: { limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('获取热门用户失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};