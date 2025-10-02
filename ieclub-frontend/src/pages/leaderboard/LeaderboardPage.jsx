import React, { useState } from 'react';
import { Avatar } from '../../components/common/Avatar.jsx';

export const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('reputation');

  const reputationLeaders = [
    { rank: 1, name: '张明', avatar: '👨‍💻', major: '计算机科学', score: 2456, trend: '+15' },
    { rank: 2, name: '李思', avatar: '👩‍🔬', major: '生物医学工程', score: 2134, trend: '+8' },
    { rank: 3, name: '王浩', avatar: '🧑‍🎨', major: '工业设计', score: 1987, trend: '+12' },
    { rank: 4, name: '陈晓', avatar: '🧑‍🎓', major: '金融数学', score: 1756, trend: '+6' },
    { rank: 5, name: '刘洋', avatar: '👨‍🏫', major: '物理系', score: 1654, trend: '+9' },
  ];

  const contributionLeaders = [
    { rank: 1, name: '李思', avatar: '👩‍🔬', major: '生物医学工程', posts: 45, comments: 234, helpful: 189 },
    { rank: 2, name: '张明', avatar: '👨‍💻', major: '计算机科学', posts: 38, comments: 198, helpful: 167 },
    { rank: 3, name: '王浩', avatar: '🧑‍🎨', major: '工业设计', posts: 32, comments: 176, helpful: 145 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-10">🏆</div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">社区排行榜</h1>
          <p className="text-lg opacity-90">展示最活跃和最有贡献的社区成员</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {['reputation', 'contribution', 'newbie'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-600 hover:bg-gray-50'}`}>
              {tab === 'reputation' && '🏆 声望榜'} {tab === 'contribution' && '⭐ 贡献榜'} {tab === 'newbie' && '🌱 新人榜'}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'reputation' && (
            <div className="space-y-3">
              {reputationLeaders.map((user, idx) => (
                <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${idx < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {user.rank}
                  </div>
                  <Avatar src={user.avatar} size="md" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.major}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{user.score}</p>
                    <p className="text-sm text-green-600 font-semibold">{user.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'contribution' && (
             <div className="space-y-3">
              {contributionLeaders.map((user, idx) => (
                <div key={user.rank} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border hover:shadow-md transition-all">
                  <div className="text-xl font-bold w-10 text-center text-gray-600">{user.rank}</div>
                  <Avatar src={user.avatar} size="md" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.major}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-lg font-bold text-blue-600">{user.posts}</p><p className="text-xs text-gray-600">帖子</p></div>
                    <div><p className="text-lg font-bold text-purple-600">{user.comments}</p><p className="text-xs text-gray-600">评论</p></div>
                    <div><p className="text-lg font-bold text-green-600">{user.helpful}</p><p className="text-xs text-gray-600">有用</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'newbie' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-600">新人榜即将上线，敬请期待！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};