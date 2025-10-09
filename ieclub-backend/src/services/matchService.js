
// ========== services/matchService.js ==========
const { User, UserConnection } = require('../models');
const { Op } = require('sequelize');

/**
 * 计算两个用户的兴趣匹配度
 * @param {Array} interests1 - 用户1的兴趣
 * @param {Array} interests2 - 用户2的兴趣
 * @returns {Number} 匹配度 (0-1)
 */
const calculateInterestMatch = (interests1, interests2) => {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0;
  }
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return intersection / union; // Jaccard相似度
};

/**
 * 计算技能匹配度
 */
const calculateSkillMatch = (skills1, skills2) => {
  return calculateInterestMatch(skills1, skills2);
};

/**
 * 获取用户的推荐好友
 * @param {Number} userId - 用户ID
 * @param {Number} limit - 推荐数量
 * @returns {Array} 推荐用户列表
 */
exports.getRecommendations = async (userId, limit = 10) => {
  try {
    const currentUser = await User.findByPk(userId);
    if (!currentUser) {
      throw new Error('用户不存在');
    }
    
    // 获取已连接的好友ID
    const connections = await UserConnection.findAll({
      where: {
        [Op.or]: [
          { userId: userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      }
    });
    
    const connectedIds = connections.map(conn => 
      conn.userId === userId ? conn.friendId : conn.userId
    );
    
    // 获取所有其他用户（排除自己和已连接的）
    const candidates = await User.findAll({
      where: {
        id: {
          [Op.notIn]: [userId, ...connectedIds]
        }
      },
      attributes: ['id', 'username', 'avatar', 'bio', 'major', 'grade', 'interests', 'skills'],
      limit: 100 // 先获取较多候选人
    });
    
    // 计算匹配度
    const recommendations = candidates.map(candidate => {
      const interestScore = calculateInterestMatch(
        currentUser.interests,
        candidate.interests
      );
      
      const skillScore = calculateSkillMatch(
        currentUser.skills,
        candidate.skills
      );
      
      // 同专业加分
      const majorBonus = currentUser.major === candidate.major ? 0.2 : 0;
      
      // 同年级加分
      const gradeBonus = currentUser.grade === candidate.grade ? 0.1 : 0;
      
      // 综合评分
      const matchScore = (
        interestScore * 0.4 +
        skillScore * 0.3 +
        majorBonus +
        gradeBonus
      );
      
      // 计算共同兴趣
      const commonInterests = currentUser.interests?.filter(i => 
        candidate.interests?.some(ci => ci.toLowerCase() === i.toLowerCase())
      ) || [];
      
      const commonSkills = currentUser.skills?.filter(s => 
        candidate.skills?.some(cs => cs.toLowerCase() === s.toLowerCase())
      ) || [];
      
      return {
        user: candidate,
        matchScore,
        commonInterests,
        commonSkills,
        sameMajor: currentUser.major === candidate.major,
        sameGrade: currentUser.grade === candidate.grade
      };
    });
    
    // 按匹配度排序并返回前N个
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('获取推荐失败:', error);
    throw error;
  }
};