// ==================== src/services/socketService.js ====================
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const { User, Notification } = require('../models');

/**
 * WebSocket实时通信服务
 */
class SocketService {
  constructor() {
    this.io = null;
    this.onlineUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  /**
   * 初始化Socket.IO服务器
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('✅ Socket.IO服务已启动');
  }

  /**
   * 设置中间件
   */
  setupMiddleware() {
    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('认证失败'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
          return next(new Error('用户不存在'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        logger.error('Socket认证失败:', error);
        next(new Error('认证失败'));
      }
    });
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      // 用户上线
      socket.on('user:online', () => this.handleUserOnline(socket));
      
      // 用户下线
      socket.on('user:offline', () => this.handleUserOffline(socket));
      
      // 发送私信
      socket.on('message:send', (data) => this.handleSendMessage(socket, data));
      
      // 输入状态
      socket.on('message:typing', (data) => this.handleTyping(socket, data));
      
      // 加入房间（帖子讨论）
      socket.on('room:join', (roomId) => this.handleJoinRoom(socket, roomId));
      
      // 离开房间
      socket.on('room:leave', (roomId) => this.handleLeaveRoom(socket, roomId));
      
      // 房间消息
      socket.on('room:message', (data) => this.handleRoomMessage(socket, data));
      
      // 点赞通知
      socket.on('post:like', (data) => this.handlePostLike(socket, data));
      
      // 评论通知
      socket.on('post:comment', (data) => this.handlePostComment(socket, data));
      
      // 关注通知
      socket.on('user:follow', (data) => this.handleUserFollow(socket, data));
      
      // 断开连接
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * 处理连接
   */
  async handleConnection(socket) {
    const userId = socket.userId;
    
    logger.info(`用户连接: ${userId}`, {
      socketId: socket.id,
      ip: socket.handshake.address
    });

    // 记录在线用户
    this.onlineUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    // 加入用户专属房间
    socket.join(`user:${userId}`);

    // 更新在线状态到Redis
    await redis.sadd('online:users', userId);
    await redis.hset(`user:${userId}:socket`, {
      socketId: socket.id,
      connectedAt: Date.now()
    });

    // 通知好友用户上线
    await this.notifyFriendsOnlineStatus(userId, true);

    // 发送离线消息
    await this.sendOfflineMessages(socket);

    // 广播在线人数
    this.broadcastOnlineCount();
  }

  /**
   * 处理用户上线
   */
  async handleUserOnline(socket) {
    const userId = socket.userId;
    
    // 更新最后上线时间
    await User.update(
      { lastLoginAt: new Date(), status: 'online' },
      { where: { id: userId } }
    );

    // 发送欢迎消息
    socket.emit('system:message', {
      type: 'welcome',
      message: '欢迎回来！',
      timestamp: Date.now()
    });
  }

  /**
   * 处理用户下线
   */
  async handleUserOffline(socket) {
    const userId = socket.userId;
    
    await User.update(
      { status: 'offline' },
      { where: { id: userId } }
    );

    await this.notifyFriendsOnlineStatus(userId, false);
  }

  /**
   * 处理发送私信
   */
  async handleSendMessage(socket, data) {
    const { toUserId, content, type = 'text' } = data;
    const fromUserId = socket.userId;

    try {
      // 创建消息记录
      const { Message } = require('../models');
      const message = await Message.create({
        fromUserId,
        toUserId,
        content,
        type,
        status: 'sent'
      });

      // 发送给接收者
      const sent = await this.sendToUser(toUserId, 'message:receive', {
        id: message.id,
        fromUserId,
        fromUser: {
          id: socket.user.id,
          nickname: socket.user.nickname,
          avatar: socket.user.avatar
        },
        content,
        type,
        timestamp: message.createdAt
      });

      // 如果接收者不在线，存储为离线消息
      if (!sent) {
        await redis.lpush(`offline:messages:${toUserId}`, {
          messageId: message.id,
          fromUserId,
          content,
          timestamp: Date.now()
        });
      }

      // 确认发送成功
      socket.emit('message:sent', {
        messageId: message.id,
        status: sent ? 'delivered' : 'pending',
        timestamp: Date.now()
      });

      logger.info(`消息发送: ${fromUserId} -> ${toUserId}`);
    } catch (error) {
      logger.error('发送消息失败:', error);
      socket.emit('message:error', {
        error: '发送失败',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 处理输入状态
   */
  handleTyping(socket, data) {
    const { toUserId, isTyping } = data;
    
    this.sendToUser(toUserId, 'message:typing', {
      fromUserId: socket.userId,
      isTyping,
      timestamp: Date.now()
    });
  }

  /**
   * 处理加入房间
   */
  async handleJoinRoom(socket, roomId) {
    socket.join(`room:${roomId}`);
    
    // 通知房间内其他人
    socket.to(`room:${roomId}`).emit('room:user-joined', {
      userId: socket.userId,
      user: {
        id: socket.user.id,
        nickname: socket.user.nickname,
        avatar: socket.user.avatar
      },
      timestamp: Date.now()
    });

    // 发送房间信息
    const memberCount = await this.getRoomMemberCount(roomId);
    socket.emit('room:info', {
      roomId,
      memberCount,
      timestamp: Date.now()
    });

    logger.info(`用户加入房间: ${socket.userId} -> room:${roomId}`);
  }

  /**
   * 处理离开房间
   */
  handleLeaveRoom(socket, roomId) {
    socket.leave(`room:${roomId}`);
    
    socket.to(`room:${roomId}`).emit('room:user-left', {
      userId: socket.userId,
      timestamp: Date.now()
    });

    logger.info(`用户离开房间: ${socket.userId} <- room:${roomId}`);
  }

  /**
   * 处理房间消息
   */
  async handleRoomMessage(socket, data) {
    const { roomId, content, type = 'text' } = data;

    const message = {
      id: Date.now(),
      roomId,
      userId: socket.userId,
      user: {
        id: socket.user.id,
        nickname: socket.user.nickname,
        avatar: socket.user.avatar
      },
      content,
      type,
      timestamp: Date.now()
    };

    // 广播到房间
    this.io.to(`room:${roomId}`).emit('room:message', message);

    // 保存到数据库（可选）
    // await RoomMessage.create(message);
  }

  /**
   * 处理点赞通知
   */
  async handlePostLike(socket, data) {
    const { postId, authorId } = data;

    if (authorId === socket.userId) return; // 自己点赞不通知

    // 创建通知
    await Notification.create({
      userId: authorId,
      type: 'like',
      title: '新的点赞',
      content: `${socket.user.nickname} 点赞了你的帖子`,
      data: { postId, fromUserId: socket.userId }
    });

    // 实时推送
    this.sendToUser(authorId, 'notification:like', {
      postId,
      fromUser: {
        id: socket.user.id,
        nickname: socket.user.nickname,
        avatar: socket.user.avatar
      },
      timestamp: Date.now()
    });
  }

  /**
   * 处理评论通知
   */
  async handlePostComment(socket, data) {
    const { postId, authorId, content } = data;

    if (authorId === socket.userId) return;

    await Notification.create({
      userId: authorId,
      type: 'comment',
      title: '新的评论',
      content: `${socket.user.nickname} 评论了你的帖子: ${content}`,
      data: { postId, fromUserId: socket.userId, content }
    });

    this.sendToUser(authorId, 'notification:comment', {
      postId,
      content,
      fromUser: {
        id: socket.user.id,
        nickname: socket.user.nickname,
        avatar: socket.user.avatar
      },
      timestamp: Date.now()
    });
  }

  /**
   * 处理关注通知
   */
  async handleUserFollow(socket, data) {
    const { followedUserId } = data;

    await Notification.create({
      userId: followedUserId,
      type: 'follow',
      title: '新的关注',
      content: `${socket.user.nickname} 关注了你`,
      data: { fromUserId: socket.userId }
    });

    this.sendToUser(followedUserId, 'notification:follow', {
      fromUser: {
        id: socket.user.id,
        nickname: socket.user.nickname,
        avatar: socket.user.avatar
      },
      timestamp: Date.now()
    });
  }

  /**
   * 处理断开连接
   */
  async handleDisconnect(socket) {
    const userId = socket.userId;

    logger.info(`用户断开: ${userId}`);

    // 清理在线状态
    this.onlineUsers.delete(userId);
    this.userSockets.delete(socket.id);

    await redis.srem('online:users', userId);
    await redis.del(`user:${userId}:socket`);

    // 更新用户状态
    await User.update(
      { status: 'offline', lastSeenAt: new Date() },
      { where: { id: userId } }
    );

    // 通知好友
    await this.notifyFriendsOnlineStatus(userId, false);

    // 广播在线人数
    this.broadcastOnlineCount();
  }

  /**
   * 发送消息给指定用户
   */
  async sendToUser(userId, event, data) {
    const socketId = this.onlineUsers.get(userId);
    
    if (socketId) {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    }
    
    return false;
  }

  /**
   * 广播给所有在线用户
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * 通知好友在线状态
   */
  async notifyFriendsOnlineStatus(userId, isOnline) {
    const { UserConnection } = require('../models');
    
    // 获取好友列表
    const friends = await UserConnection.findAll({
      where: { followerId: userId, status: 'accepted' }
    });

    // 通知每个好友
    for (const friend of friends) {
      this.sendToUser(friend.followingId, 'user:status', {
        userId,
        status: isOnline ? 'online' : 'offline',
        timestamp: Date.now()
      });
    }
  }

  /**
   * 发送离线消息
   */
  async sendOfflineMessages(socket) {
    const userId = socket.userId;
    const messages = await redis.lrange(`offline:messages:${userId}`, 0, -1);

    for (const msg of messages) {
      socket.emit('message:receive', msg);
    }

    // 清空离线消息
    if (messages.length > 0) {
      await redis.del(`offline:messages:${userId}`);
    }
  }

  /**
   * 获取房间成员数量
   */
  async getRoomMemberCount(roomId) {
    const sockets = await this.io.in(`room:${roomId}`).fetchSockets();
    return sockets.length;
  }

  /**
   * 广播在线人数
   */
  async broadcastOnlineCount() {
    const count = await redis.scard('online:users');
    this.broadcast('system:online-count', {
      count,
      timestamp: Date.now()
    });
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * 获取所有在线用户
   */
  async getOnlineUsers() {
    return await redis.smembers('online:users');
  }

  /**
   * 获取在线用户数量
   */
  getOnlineCount() {
    return this.onlineUsers.size;
  }
}

module.exports = new SocketService();


// ==================== src/models/Message.js ====================
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fromUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '发送者ID'
    },
    toUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收者ID'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容'
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'link', 'system'),
      defaultValue: 'text',
      comment: '消息类型'
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      defaultValue: 'sent',
      comment: '消息状态'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅读时间'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['fromUserId'] },
      { fields: ['toUserId'] },
      { fields: ['createdAt'] },
      { fields: ['fromUserId', 'toUserId'] }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      as: 'fromUser',
      foreignKey: 'fromUserId'
    });
    Message.belongsTo(models.User, {
      as: 'toUser',
      foreignKey: 'toUserId'
    });
  };

  return Message;
};


// ==================== src/controllers/messageController.js ====================
const { Message, User } = require('../models');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');

class MessageController {
  /**
   * 获取对话列表
   */
  static async getConversations(req, res) {
    try {
      const userId = req.user.id;

      // 获取最近对话
      const conversations = await Message.findAll({
        where: {
          [Op.or]: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        },
        include: [
          { model: User, as: 'fromUser', attributes: ['id', 'nickname', 'avatar'] },
          { model: User, as: 'toUser', attributes: ['id', 'nickname', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      // 按对话分组
      const conversationMap = new Map();
      
      for (const msg of conversations) {
        const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            user: msg.fromUserId === userId ? msg.toUser : msg.fromUser,
            lastMessage: msg,
            unreadCount: 0,
            isOnline: socketService.isUserOnline(otherUserId)
          });
        }

        // 统计未读消息
        if (msg.toUserId === userId && msg.status !== 'read') {
          conversationMap.get(otherUserId).unreadCount++;
        }
      }

      const result = Array.from(conversationMap.values());

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取对话历史
   */
  static async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const messages = await Message.findAndCountAll({
        where: {
          [Op.or]: [
            { fromUserId: userId, toUserId: otherUserId },
            { fromUserId: otherUserId, toUserId: userId }
          ]
        },
        include: [
          { model: User, as: 'fromUser', attributes: ['id', 'nickname', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
      });

      // 标记消息为已读
      await Message.update(
        { status: 'read', readAt: new Date() },
        {
          where: {
            fromUserId: otherUserId,
            toUserId: userId,
            status: { [Op.ne]: 'read' }
          }
        }
      );

      res.json({
        success: true,
        data: messages.rows.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.count
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 标记消息已读
   */
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      await Message.update(
        { status: 'read', readAt: new Date() },
        {
          where: {
            id: messageId,
            toUserId: userId
          }
        }
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 删除消息
   */
  static async deleteMessage(req, res) {
    try {
      const userId = req.user.id;
      const { messageId } = req.params;

      const message = await Message.findOne({
        where: {
          id: messageId,
          [Op.or]: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          error: '消息不存在'
        });
      }

      await message.destroy();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * 获取未读消息数
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Message.count({
        where: {
          toUserId: userId,
          status: { [Op.ne]: 'read' }
        }
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = MessageController;


// ==================== src/routes/message.js ====================
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// 所有路由需要认证
router.use(auth.required);

// 获取对话列表
router.get('/conversations', MessageController.getConversations);

// 获取对话历史
router.get('/:otherUserId', MessageController.getMessages);

// 标记已读
router.put('/:messageId/read', MessageController.markAsRead);

// 删除消息
router.delete('/:messageId', MessageController.deleteMessage);

// 获取未读数
router.get('/unread/count', MessageController.getUnreadCount);

module.exports = router;


// ==================== 在 server.js 中集成 ====================
const app = require('./app');
const http = require('http');
const socketService = require('./services/socketService');

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化Socket.IO
socketService.initialize(server);

// 启动服务器
server.listen(PORT, () => {
  logger.info(`🚀 服务器运行在端口 ${PORT}`);
  logger.info(`📡 WebSocket服务已启动`);
});


// ==================== 前端Socket客户端 ====================
// src/services/socket.js

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * 连接到服务器
   */
  connect(token) {
    if (this.socket) return;

    this.socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket连接成功');
      this.connected = true;
      this.emit('user:online');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket断开连接');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket连接错误:', error);
    });

    // 监听系统消息
    this.socket.on('system:message', (data) => {
      console.log('系统消息:', data.message);
    });

    // 监听在线人数
    this.socket.on('system:online-count', (data) => {
      console.log('在线人数:', data.count);
      this.trigger('online-count', data.count);
    });

    // 监听新消息
    this.socket.on('message:receive', (data) => {
      this.trigger('new-message', data);
    });

    // 监听通知
    this.socket.on('notification:like', (data) => {
      this.trigger('notification', { type: 'like', ...data });
    });

    this.socket.on('notification:comment', (data) => {
      this.trigger('notification', { type: 'comment', ...data });
    });

    this.socket.on('notification:follow', (data) => {
      this.trigger('notification', { type: 'follow', ...data });
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.emit('user:offline');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * 发送事件
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除监听
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * 发送私信
   */
  sendMessage(toUserId, content, type = 'text') {
    this.emit('message:send', { toUserId, content, type });
  }

  /**
   * 加入房间
   */
  joinRoom(roomId) {
    this.emit('room:join', roomId);
  }

  /**
   * 离开房间
   */
  leaveRoom(roomId) {
    this.emit('room:leave', roomId);
  }

  /**
   * 发送房间消息
   */
  sendRoomMessage(roomId, content, type = 'text') {
    this.emit('room:message', { roomId, content, type });
  }

  /**
   * 发送输入状态
   */
  sendTyping(toUserId, isTyping) {
    this.emit('message:typing', { toUserId, isTyping });
  }

  /**
   * 点赞通知
   */
  notifyLike(postId, authorId) {
    this.emit('post:like', { postId, authorId });
  }

  /**
   * 评论通知
   */
  notifyComment(postId, authorId, content) {
    this.emit('post:comment', { postId, authorId, content });
  }

  /**
   * 关注通知
   */
  notifyFollow(followedUserId) {
    this.emit('user:follow', { followedUserId });
  }
}

export default new SocketClient();


// ==================== React组件使用示例 ====================
import React, { useState, useEffect } from 'react';
import socketClient from './services/socket';

function ChatComponent({ otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // 连接Socket
    const token = localStorage.getItem('token');
    socketClient.connect(token);

    // 监听新消息
    const handleNewMessage = (data) => {
      if (data.fromUserId === otherUserId) {
        setMessages(prev => [...prev, data]);
      }
    };

    // 监听输入状态
    const handleTyping = (data) => {
      if (data.fromUserId === otherUserId) {
        setIsTyping(data.isTyping);
      }
    };

    socketClient.on('new-message', handleNewMessage);
    socketClient.socket?.on('message:typing', handleTyping);

    return () => {
      socketClient.off('new-message', handleNewMessage);
    };
  }, [otherUserId]);

  const sendMessage = () => {
    if (input.trim()) {
      socketClient.sendMessage(otherUserId, input);
      setMessages(prev => [...prev, {
        fromUserId: 'me',
        content: input,
        timestamp: Date.now()
      }]);
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socketClient.sendTyping(otherUserId, true);
    
    // 停止输入3秒后发送停止状态
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socketClient.sendTyping(otherUserId, false);
    }, 3000);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.fromUserId === 'me' ? 'sent' : 'received'}>
            {msg.content}
          </div>
        ))}
        {isTyping && <div className="typing-indicator">对方正在输入...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
        />
        <button onClick={sendMessage}>发送</button>
      </div>
    </div>
  );
}


// ==================== package.json 依赖 ====================
/*
{
  "dependencies": {
    "socket.io": "^4.6.1",
    "socket.io-client": "^4.6.1"
  }
}

安装命令：
npm install socket.io socket.io-client
*/