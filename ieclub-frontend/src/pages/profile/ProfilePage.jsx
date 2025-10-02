import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
// 导入所有需要的通用组件
import { Button } from '../../components/common/Button.jsx';
import { Tag } from '../../components/common/Tag.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
// 导入所有需要的图标
import { Edit3, FileText, Users, Heart, Award, Camera, Shield, Star, Plus } from 'lucide-react';

// ==================== 个人主页 (主导出组件) ====================
export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const stats = [
    { label: '帖子', value: 12, icon: FileText },
    { label: '粉丝', value: user?.followers || 23, icon: Users },
    { label: '关注', value: user?.following || 45, icon: Heart },
    { label: '声望', value: user?.reputation || 156, icon: Award }
  ];

  const userProjects = [
    { id: 1, title: 'AI学习助手', description: '基于大模型的个性化学习推荐系统，已服务100+用户', status: 'ongoing', tags: ['AI', 'Python', 'Education'], stars: 23 },
    { id: 2, title: '跨学科知识图谱', description: '连接不同学科知识点的可视化平台，获校级创新奖', status: 'completed', tags: ['知识图谱', 'D3.js', '可视化'], stars: 45 }
  ];

  const [ocrFile, setOcrFile] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const handleOCRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOcrFile(file);
      setOcrProcessing(true);
      setTimeout(() => {
        alert(`OCR识别完成！\n\n识别内容预览：\n━━━━━━━━━━━━━━\n深度学习基础\n\n第三章：优化算法\n\n1. 梯度下降法\n   • 批量梯度下降\n   • 随机梯度下降\n   • Mini-batch梯度下降\n\n2. 动量法\n   • 指数加权平均\n   • 动量优化\n━━━━━━━━━━━━━━\n\n✅ 已自动保存到笔记`);
        setOcrFile(null);
        setOcrProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="p-8 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <Avatar src={user?.avatar} size="xl" status="online" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-bold">{user?.username || '用户'}</h2>
                  <Shield size={24} fill="white" />
                </div>
                <p className="text-xl opacity-90 mb-1">{user?.major || '专业'}</p>
                <p className="text-lg opacity-75">{user?.school || '学校'} · {user?.grade || '年级'}</p>
              </div>
            </div>
            <Button variant="secondary" icon={Edit3} onClick={() => setIsEditing(true)}>编辑资料</Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all text-center">
              <Icon size={24} className="mx-auto mb-2 text-blue-500" />
              <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {['posts', 'projects', 'ocr'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
              {tab === 'posts' && '我的帖子'} {tab === 'projects' && '我的项目'} {tab === 'ocr' && 'OCR识别'}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">还没有发布帖子</p>
              <Button variant="primary" icon={Plus}>发布第一篇帖子</Button>
            </div>
          )}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {userProjects.map(project => (
                <div key={project.id} className="border-l-4 border-blue-500 pl-6 py-4 hover:bg-gray-50 rounded-r-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-xl text-gray-800">{project.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {project.status === 'ongoing' ? '进行中' : '已完成'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={16} fill="currentColor" />
                      <span className="font-semibold">{project.stars}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  <div className="flex gap-2">
                    {project.tags.map((tag, idx) => (<Tag key={idx} variant="gray">{tag}</Tag>))}
                  </div>
                </div>
              ))}
              <Button variant="outline" icon={Plus} className="w-full">添加新项目</Button>
            </div>
          )}
          {activeTab === 'ocr' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Camera size={28} className="text-blue-500" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">讲座资料 OCR识别</h3>
                  <p className="text-sm text-gray-600">上传讲座PPT照片，AI自动识别文字内容</p>
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <input type="file" accept="image/*" onChange={handleOCRUpload} className="hidden" id="ocr-upload" disabled={ocrProcessing} />
                <label htmlFor="ocr-upload" className="cursor-pointer">
                  {ocrProcessing ? (
                    <div>
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-blue-600 font-semibold">正在识别中...</p>
                    </div>
                  ) : (
                    <div>
                      <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-700 font-semibold mb-2">点击上传讲座照片</p>
                      <p className="text-sm text-gray-500">支持 JPG, PNG 格式，单张最大5MB</p>
                    </div>
                  )}
                </label>
              </div>
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800"><strong>使用技巧：</strong> 拍照时保持文字清晰、光线充足，识别准确率更高</p>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold mb-3">识别历史</h4>
                <div className="space-y-2 text-sm text-gray-600"><p>暂无识别记录</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};