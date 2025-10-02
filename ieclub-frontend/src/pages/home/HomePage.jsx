import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import { useAuth } from '../../store/AuthContext.jsx';
import { Button } from '../../components/common/Button.jsx';
// 导入我们刚刚创建的两个新组件
import { PostCard } from '../../components/post/PostCard.jsx';
import { CreatePostModal } from '../../components/post/CreatePostModal.jsx';
import { Plus, TrendingUp, Filter } from 'lucide-react';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate(); // <-- 在这里调用
  const [posts, setPosts] = useState([
    { id: 1, author: '张明', avatar: '👨‍💻', major: '计算机科学与工程系', title: '寻找对AI+教育感兴趣的小伙伴', content: '我正在做一个基于大模型的个性化学习助手项目...\n✅ 原型设计\n✅ 基础架构搭建', category: '项目招募', tags: ['AI', '教育科技'], likes: 23, comments: 8, time: '2小时前', verified: true, commentsList: [{ id: 1, author: '李思', avatar: '👩', content: '很有意思的项目！', likes: 3, time: '1小时前' }] },
    { id: 2, author: '李思', avatar: '👩‍🔬', major: '生物医学工程系', title: '分享：如何从零开始学习Python数据分析', content: '最近整理了一套适合生物医学背景同学的Python学习路径...', category: '资源分享', tags: ['Python', '数据分析'], likes: 45, comments: 15, time: '5小时前', verified: true, images: [1, 2], commentsList: [] },
    { id: 3, author: '王浩', avatar: '🧑‍🎨', major: '工业设计', title: '【资源分享】超全UI设计工具合集', content: '整理了一份设计师必备工具清单...', category: '资源分享', tags: ['设计', '工具'], likes: 67, comments: 22, time: '1天前', commentsList: [] }
  ]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const handleCreatePost = (postData) => {
    const newPost = { id: Date.now(), author: '张明', avatar: '👨‍💻', major: '计算机科学与工程系', title: postData.title, content: postData.content, category: postData.category, tags: postData.tags.split(' ').filter(t => t), likes: 0, comments: 0, time: '刚刚', verified: true, commentsList: [] };
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  // 替换掉的部分
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-200px)]">
        <div className="text-6xl mb-6">🎓</div>
        <h2 className="text-3xl font-bold mb-4">欢迎来到IEclub</h2>
        <p className="text-gray-600 mb-8">登录后查看完整内容</p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          立即登录
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">欢迎来到 IEclub 👋</h1>
          <p className="text-xl opacity-95 mb-2">南方科技大学跨学科交流社区</p>
          <p className="text-sm opacity-80">连接思想 · 激发创新 · 共同成长</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" icon={Plus} onClick={() => setShowCreatePost(true)}>发布帖子</Button>
        <Button variant="outline" icon={TrendingUp}>热门话题</Button>
        <Button variant="ghost" icon={Filter}>筛选</Button>
      </div>
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'academic', 'project', 'resource', 'qa'].map(filterType => (
              <button key={filterType} onClick={() => setFilter(filterType)} className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === filterType ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="latest">最新发布</option>
            <option value="hot">最热</option>
            <option value="comments">最多评论</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {posts.map(post => (<PostCard key={post.id} post={post} />))}
      </div>
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onSubmit={handleCreatePost} />
    </div>
  );
};