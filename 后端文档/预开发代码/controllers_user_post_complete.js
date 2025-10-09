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


// ==================== src/controllers/postController.js ====================
const { Post, User, Comment, Like, Bookmark } = require('../models');
const { Op } = require('sequelize');
const { uploadToOSS } = require('../services/uploadService');

/**
 * 获取帖子列表（支持分页、排序、筛选）
 */
exports.getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sort = 'latest',
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // 分类筛选
    if (category && category !== 'all') {
      where.category = category;
    }

    // 搜索功能
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 排序方式
    let order;
    if (sort === 'hot') {
      // 热门：综合点赞数、评论数、浏览数
      order = [
        ['likeCount', 'DESC'],
        ['commentCount', 'DESC'],
        ['viewCount', 'DESC']
      ];
    } else if (sort === 'popular') {
      // 最受欢迎：仅按点赞数
      order = [['likeCount', 'DESC']];
    } else {
      // 最新：默认排序
      order = [['createdAt', 'DESC']];
    }

    const posts = await Post.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar', 'major', 'grade']
      }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.rows,
      total: posts.count,
      page: parseInt(page),
      totalPages: Math.ceil(posts.count / limit),
      hasMore: offset + posts.rows.length < posts.count
    });
  } catch (error) {
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};

/**
 * 获取单个帖子详情
 */
exports.getPostById = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const post = await Post.findByPk(postId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'major', 'grade', 'bio']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar']
          }],
          order: [['createdAt', 'DESC']],
          limit: 20 // 最多返回20条评论
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 增加浏览量
    await post.increment('viewCount');

    // 如果用户已登录，检查是否点赞和收藏
    let isLiked = false;
    let isBookmarked = false;
    
    if (req.user) {
      isLiked = await Like.findOne({
        where: {
          userId: req.user.id,
          postId: postId
        }
      }) !== null;

      isBookmarked = await Bookmark.findOne({
        where: {
          userId: req.user.id,
          postId: postId
        }
      }) !== null;
    }

    res.json({
      ...post.toJSON(),
      isLiked,
      isBookmarked
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};

/**
 * 创建帖子
 */
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    // 验证必填字段
    if (!title || !content || !category) {
      return res.status(400).json({ 
        code: 400,
        message: '标题、内容和分类不能为空' 
      });
    }

    // 处理图片上传
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(file => uploadToOSS(file, 'posts'))
      );
    }

    // 处理标签（如果是字符串，解析为数组）
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // 创建帖子
    const post = await Post.create({
      title,
      content,
      category,
      tags: parsedTags,
      images,
      userId: req.user.id
    });

    // 返回包含作者信息的帖子
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    res.status(201).json({ 
      message: '发布成功', 
      post: postWithAuthor 
    });
  } catch (error) {
    console.error('创建帖子失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '发布失败', 
      error: error.message 
    });
  }
};

/**
 * 更新帖子
 */
exports.updatePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content, category, tags } = req.body;

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 权限检查：只有作者可以修改
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        code: 403,
        message: '无权限修改此帖子' 
      });
    }

    // 构建更新对象
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (tags) updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    await post.update(updateData);
    
    res.json({ 
      message: '更新成功', 
      post 
    });
  } catch (error) {
    console.error('更新帖子失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '更新失败', 
      error: error.message 
    });
  }
};

/**
 * 删除帖子
 */
exports.deletePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 权限检查：只有作者可以删除
    if (post.userId !== req.user.id) {
      return res.status(403).json({ 
        code: 403,
        message: '无权限删除此帖子' 
      });
    }

    await post.destroy();
    
    res.json({ 
      message: '删除成功' 
    });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '删除失败', 
      error: error.message 
    });
  }
};

/**
 * 点赞/取消点赞
 */
exports.toggleLike = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // 检查帖子是否存在
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 查找是否已点赞
    const like = await Like.findOne({
      where: {
        userId: req.user.id,
        postId: postId
      }
    });

    if (like) {
      // 已点赞，取消点赞
      await like.destroy();
      await post.decrement('likeCount');
      res.json({ 
        message: '取消点赞', 
        liked: false,
        likeCount: post.likeCount - 1
      });
    } else {
      // 未点赞，添加点赞
      await Like.create({
        userId: req.user.id,
        postId: postId
      });
      await post.increment('likeCount');
      res.json({ 
        message: '点赞成功', 
        liked: true,
        likeCount: post.likeCount + 1
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '操作失败', 
      error: error.message 
    });
  }
};

/**
 * 收藏/取消收藏
 */
exports.toggleBookmark = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // 检查帖子是否存在
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 查找是否已收藏
    const bookmark = await Bookmark.findOne({
      where: {
        userId: req.user.id,
        postId: postId
      }
    });

    if (bookmark) {
      // 已收藏，取消收藏
      await bookmark.destroy();
      res.json({ 
        message: '取消收藏', 
        bookmarked: false 
      });
    } else {
      // 未收藏，添加收藏
      await Bookmark.create({
        userId: req.user.id,
        postId: postId
      });
      res.json({ 
        message: '收藏成功', 
        bookmarked: true 
      });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '操作失败', 
      error: error.message 
    });
  }
};

/**
 * 获取帖子的所有评论
 */
exports.getComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const comments = await Comment.findAndCountAll({
      where: { postId: postId },
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
      comments: comments.rows,
      total: comments.count,
      page: parseInt(page),
      totalPages: Math.ceil(comments.count / limit)
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};

/**
 * 添加评论
 */
exports.addComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        code: 400,
        message: '评论内容不能为空' 
      });
    }

    // 检查帖子是否存在
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ 
        code: 404,
        message: '帖子不存在' 
      });
    }

    // 创建评论
    const comment = await Comment.create({
      content: content.trim(),
      userId: req.user.id,
      postId: postId
    });

    // 增加帖子评论数
    await post.increment('commentCount');

    // 返回包含作者信息的评论
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    res.status(201).json({ 
      message: '评论成功', 
      comment: commentWithAuthor 
    });
  } catch (error) {
    console.error('评论失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '评论失败', 
      error: error.message 
    });
  }
};

/**
 * 获取用户收藏的帖子
 */
exports.getBookmarkedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const bookmarks = await Bookmark.findAndCountAll({
      where: { userId: req.user.id },
      include: [{
        model: Post,
        as: 'post',
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const posts = bookmarks.rows.map(b => b.post);

    res.json({
      posts,
      total: bookmarks.count,
      page: parseInt(page),
      totalPages: Math.ceil(bookmarks.count / limit)
    });
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取失败', 
      error: error.message 
    });
  }
};
