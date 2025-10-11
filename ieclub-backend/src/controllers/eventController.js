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
        attributes: ['id', 'username', 'avatarUrl']
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
          attributes: ['id', 'username', 'avatarUrl', 'major', 'grade']
        },
        {
          model: EventRegistration,
          as: 'registrations',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatarUrl']
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
        attributes: ['id', 'username', 'avatarUrl', 'email', 'major', 'grade']
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

