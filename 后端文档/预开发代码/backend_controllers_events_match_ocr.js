// ========== controllers/eventController.js ==========
const { Event, User, EventRegistration } = require('../models');
const { Op } = require('sequelize');
const { uploadToOSS } = require('../services/uploadService');
const { sendEventReminderEmail } = require('../services/emailService');

exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // 根据状态筛选
    const now = new Date();
    if (status === 'upcoming') {
      where.startTime = { [Op.gt]: now };
    } else if (status === 'ongoing') {
      where.startTime = { [Op.lte]: now };
      where.endTime = { [Op.gte]: now };
    } else if (status === 'past') {
      where.endTime = { [Op.lt]: now };
    }

    // 分类筛选
    if (category) {
      where.category = category;
    }

    // 搜索
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const events = await Event.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'organizer',
        attributes: ['id', 'username', 'avatar']
      }],
      order: [['startTime', 'ASC']],
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
    res.status(500).json({ message: '获取活动列表失败', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'avatar', 'major', 'grade']
        },
        {
          model: EventRegistration,
          as: 'registrations',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar']
          }]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 检查当前用户是否已报名
    let isRegistered = false;
    if (req.user) {
      const registration = await EventRegistration.findOne({
        where: {
          eventId: event.id,
          userId: req.user.id
        }
      });
      isRegistered = !!registration;
    }

    res.json({ ...event.toJSON(), isRegistered });
  } catch (error) {
    res.status(500).json({ message: '获取活动详情失败', error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      startTime, 
      endTime, 
      maxParticipants,
      category,
      tags 
    } = req.body;

    let coverUrl = null;
    if (req.file) {
      coverUrl = await uploadToOSS(req.file, 'events');
    }

    const event = await Event.create({
      title,
      description,
      location,
      startTime,
      endTime,
      maxParticipants: maxParticipants || null,
      category,
      tags: tags ? JSON.parse(tags) : [],
      cover: coverUrl,
      organizerId: req.user.id
    });

    res.status(201).json({ message: '活动创建成功', event });
  } catch (error) {
    res.status(500).json({ message: '创建活动失败', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: '活动不存在' });
    }

    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ message: '无权限修改此活动' });
    }

    await event.update(req.body);
    res.json({ message: '活动更新成功', event });
  } catch (error) {
    res.status(500).json({ message: '更新活动失败', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: '活动不存在' });
    }

    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ message: '无权限删除此活动' });
    }

    await event.destroy();
    res.json({ message: '活动删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除活动失败', error: error.message });
  }
};

exports.registerEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 检查活动是否已结束
    if (new Date(event.endTime) < new Date()) {
      return res.status(400).json({ message: '活动已结束，无法报名' });
    }

    // 检查是否已报名
    const existingRegistration = await EventRegistration.findOne({
      where: {
        eventId: event.id,
        userId: req.user.id
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ message: '您已报名此活动' });
    }

    // 检查人数限制
    if (event.maxParticipants) {
      const registrationCount = await EventRegistration.count({
        where: { eventId: event.id }
      });

      if (registrationCount >= event.maxParticipants) {
        return res.status(400).json({ message: '活动报名人数已满' });
      }
    }

    // 创建报名记录
    const registration = await EventRegistration.create({
      eventId: event.id,
      userId: req.user.id
    });

    // 增加参与人数
    await event.increment('participantCount');

    res.status(201).json({ message: '报名成功', registration });
  } catch (error) {
    res.status(500).json({ message: '报名失败', error: error.message });
  }
};

exports.unregisterEvent = async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      where: {
        eventId: req.params.id,
        userId: req.user.id
      }
    });

    if (!registration) {
      return res.status(404).json({ message: '未找到报名记录' });
    }

    await registration.destroy();
    
    // 减少参与人数
    await Event.decrement('participantCount', { 
      where: { id: req.params.id } 
    });

    res.json({ message: '取消报名成功' });
  } catch (error) {
    res.status(500).json({ message: '取消报名失败', error: error.message });
  }
};

exports.getRegistrations = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 只有组织者可以查看报名列表
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ message: '无权限查看报名列表' });
    }

    const registrations = await EventRegistration.findAll({
      where: { eventId: event.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar', 'email', 'major', 'grade']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: '获取报名列表失败', error: error.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      where: {
        eventId: req.params.id,
        userId: req.user.id
      }
    });

    if (!registration) {
      return res.status(404).json({ message: '未找到报名记录' });
    }

    if (registration.checkedIn) {
      return res.status(400).json({ message: '已签到，请勿重复签到' });
    }

    await registration.update({ 
      checkedIn: true,
      checkInTime: new Date()
    });

    res.json({ message: '签到成功' });
  } catch (error) {
    res.status(500).json({ message: '签到失败', error: error.message });
  }
};


// ========== controllers/matchController.js ==========
const { UserConnection } = require('../models');
const { getRecommendations } = require('../services/matchService');

exports.getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recommendations = await getRecommendations(req.user.id, parseInt(limit));
    
    res.json({
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    res.status(500).json({ message: '获取推荐失败', error: error.message });
  }
};

exports.sendConnectionRequest = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    // 检查是否是自己
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: '不能添加自己为好友' });
    }

    // 检查目标用户是否存在
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查是否已经是好友或已发送请求
    const existingConnection = await UserConnection.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId: targetUserId },
          { userId: targetUserId, friendId: req.user.id }
        ]
      }
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: '已经是好友了' });
      }
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ message: '已发送好友请求，等待对方确认' });
      }
    }

    // 创建连接请求
    const connection = await UserConnection.create({
      userId: req.user.id,
      friendId: targetUserId,
      status: 'pending'
    });

    res.status(201).json({ 
      message: '好友请求已发送', 
      connection 
    });
  } catch (error) {
    res.status(500).json({ message: '发送请求失败', error: error.message });
  }
};

exports.acceptConnection = async (req, res) => {
  try {
    const connection = await UserConnection.findByPk(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ message: '请求不存在' });
    }

    // 只有被请求的人可以接受
    if (connection.friendId !== req.user.id) {
      return res.status(403).json({ message: '无权限接受此请求' });
    }

    if (connection.status === 'accepted') {
      return res.status(400).json({ message: '已经是好友了' });
    }

    await connection.update({ status: 'accepted' });

    res.json({ message: '已添加为好友', connection });
  } catch (error) {
    res.status(500).json({ message: '接受请求失败', error: error.message });
  }
};

exports.rejectConnection = async (req, res) => {
  try {
    const connection = await UserConnection.findByPk(req.params.requestId);

    if (!connection) {
      return res.status(404).json({ message: '请求不存在' });
    }

    if (connection.friendId !== req.user.id) {
      return res.status(403).json({ message: '无权限拒绝此请求' });
    }

    await connection.update({ status: 'rejected' });

    res.json({ message: '已拒绝好友请求' });
  } catch (error) {
    res.status(500).json({ message: '拒绝请求失败', error: error.message });
  }
};

exports.getConnections = async (req, res) => {
  try {
    const connections = await UserConnection.findAll({
      where: {
        [Op.or]: [
          { userId: req.user.id, status: 'accepted' },
          { friendId: req.user.id, status: 'accepted' }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar', 'bio', 'major', 'grade']
        },
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'avatar', 'bio', 'major', 'grade']
        }
      ]
    });

    // 提取好友信息（排除自己）
    const friends = connections.map(conn => {
      return conn.userId === req.user.id ? conn.friend : conn.user;
    });

    res.json({ friends, count: friends.length });
  } catch (error) {
    res.status(500).json({ message: '获取好友列表失败', error: error.message });
  }
};

exports.removeConnection = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    const connection = await UserConnection.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId: targetUserId, status: 'accepted' },
          { userId: targetUserId, friendId: req.user.id, status: 'accepted' }
        ]
      }
    });

    if (!connection) {
      return res.status(404).json({ message: '好友关系不存在' });
    }

    await connection.destroy();

    res.json({ message: '已删除好友' });
  } catch (error) {
    res.status(500).json({ message: '删除好友失败', error: error.message });
  }
};


// ========== controllers/ocrController.js ==========
const { OCRRecord } = require('../models');
const { recognizeText, recognizeAccurateText } = require('../services/ocrService');
const fs = require('fs').promises;

exports.recognizeText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const { accurate = false } = req.body;

    // 选择识别方式
    const result = accurate 
      ? await recognizeAccurateText(req.file.path)
      : await recognizeText(req.file.path);

    // 保存识别记录
    const record = await OCRRecord.create({
      userId: req.user.id,
      imagePath: req.file.path,
      recognizedText: result.text,
      confidence: result.confidence,
      language: result.language
    });

    // 删除临时文件（可选，如果不需要保存原图）
    // await fs.unlink(req.file.path);

    res.json({
      message: '识别成功',
      text: result.text,
      confidence: result.confidence,
      wordsCount: result.wordsCount,
      recordId: record.id
    });
  } catch (error) {
    res.status(500).json({ message: 'OCR识别失败', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const records = await OCRRecord.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['imagePath'] } // 不返回图片路径
    });

    res.json({
      records: records.rows,
      total: records.count,
      page: parseInt(page),
      totalPages: Math.ceil(records.count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: '获取历史记录失败', error: error.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const record = await OCRRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: '记录不存在' });
    }

    if (record.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限删除此记录' });
    }

    // 删除图片文件
    try {
      await fs.unlink(record.imagePath);
    } catch (err) {
      console.error('删除图片文件失败:', err);
    }

    await record.destroy();

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
};