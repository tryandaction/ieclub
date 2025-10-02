import React, { useState } from 'react'; // <-- CORRECTED THIS LINE
// Import all necessary common components
import { Button } from '../../components/common/Button.jsx';
import { Tag } from '../../components/common/Tag.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
// Import all necessary icons
import { UserPlus } from 'lucide-react';

// ==================== Match Page Components (Temporarily here) ====================
const UserMatchCard = ({ user, onAddFriend }) => {
  const [added, setAdded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    onAddFriend(user);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Avatar src={user.avatar} size="lg" status="online" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
              <span className="bg-gradient-to-r from-green-400 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                匹配度 {user.match}%
              </span>
            </div>
            <p className="text-gray-600 mb-2">{user.major} · {user.school}</p>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {user.interests.slice(0, expanded ? undefined : 4).map((interest, i) => (
                <Tag key={i} variant="blue" interactive>{interest}</Tag>
              ))}
              {user.interests.length > 4 && !expanded && (
                <button onClick={() => setExpanded(true)} className="text-blue-600 text-sm font-semibold hover:underline">
                  +{user.interests.length - 4} 更多
                </button>
              )}
            </div>
            {user.projects && user.projects.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">最近项目</p>
                <p className="text-sm text-gray-600">{user.projects[0]}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant={added ? 'success' : 'primary'} onClick={handleAdd} icon={added ? null : UserPlus} disabled={added} className="flex-1">
                {added ? '✓ 已添加' : '添加好友'}
              </Button>
              <Button variant="outline" className="flex-1">查看主页</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Match Page (Main export component) ====================
export const MatchPage = () => {
  const [recommendedUsers] = useState([
    { id: 1, name: '陈晓', avatar: '🧑‍🎓', major: '金融数学与金融工程系', school: '南方科技大学', bio: '对数据分析和量化投资感兴趣，寻找技术背景的合作伙伴探讨金融科技创新', interests: ['数据分析', '量化交易', 'Python', '金融科技', '机器学习'], projects: ['加密货币套利策略研究'], match: 85 },
    { id: 2, name: '刘洋', avatar: '👨‍🏫', major: '物理系', school: '南方科技大学', bio: '研究量子计算与AI的交叉领域，希望找到志同道合的研究者共同探索前沿科技', interests: ['量子计算', 'AI', '科研', '理论物理', '算法优化'], projects: ['量子机器学习算法实现'], match: 78 },
    { id: 3, name: '赵欣', avatar: '👩‍💼', major: '工业设计', school: '南方科技大学', bio: '专注于教育产品的用户体验设计，热爱跨学科交流，相信设计能改变世界', interests: ['UX设计', '教育科技', '产品设计', '跨学科', '心理学'], projects: ['在线教育平台UI/UX重设计'], match: 72 },
    { id: 4, name: '李明', avatar: '👨‍💼', major: '环境科学与工程学院', school: '南方科技大学', bio: '关注可持续发展和环境保护，希望用科技手段解决环境问题', interests: ['环境科学', '数据可视化', 'GIS', '可持续发展'], projects: ['深圳市空气质量监测与预测系统'], match: 68 }
  ]);

  const handleAddFriend = (user) => {
    console.log('添加好友:', user.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">兴趣匹配推荐</h2>
        <p className="text-gray-600">基于AI算法为你推荐志同道合的伙伴</p>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <p className="text-blue-900 font-semibold mb-2">基于你的兴趣标签：AI、创业、跨学科研究</p>
            <p className="text-blue-700 text-sm">我们为你推荐了 {recommendedUsers.length} 位可能感兴趣的同学，快去认识他们吧！</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>按匹配度排序</option>
            <option>按活跃度排序</option>
            <option>最新加入</option>
          </select>
          <select className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>全部院系</option>
            <option>理工科</option>
            <option>商科</option>
            <option>人文社科</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {recommendedUsers.map(user => (<UserMatchCard key={user.id} user={user} onAddFriend={handleAddFriend} />))}
      </div>
      <div className="text-center py-8">
        <Button variant="outline">加载更多推荐</Button>
      </div>
    </div>
  );
};