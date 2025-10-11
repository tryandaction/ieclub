
// ========== controllers/matchController.js ==========
const { User, UserConnection } = require('../models');
const { Op } = require('sequelize');
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
          attributes: ['id', 'username', 'avatarUrl', 'bio', 'major', 'grade']
        },
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'avatarUrl', 'bio', 'major', 'grade']
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