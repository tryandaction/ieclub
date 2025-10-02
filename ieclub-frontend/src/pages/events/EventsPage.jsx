import React, { useState } from 'react';
// 导入所有需要的通用组件
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { TextArea } from '../../components/common/TextArea.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Tag } from '../../components/common/Tag.jsx';
// 导入所有需要的图标
import { Plus, User, Clock, MapPin } from 'lucide-react';

// ==================== 活动页面组件 (暂时放在这里) ====================
const EventCard = ({ event }) => {
  const [registered, setRegistered] = useState(false);
  const progress = (event.participants / event.maxParticipants) * 100;
  const isFull = event.participants >= event.maxParticipants;

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden group">
      <div className="relative h-40 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
        <span className="text-white text-5xl z-10">{event.icon || '📅'}</span>
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
        {isFull && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            已满员
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-600 transition-colors">{event.title}</h3>
        <div className="space-y-2 mb-4 text-gray-600">
          <p className="flex items-center gap-2"><User size={16} className="text-gray-400" /> <span className="font-semibold">{event.organizer}</span></p>
          <p className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {event.date}</p>
          <p className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {event.location}</p>
        </div>
        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-semibold">报名进度</span>
            <span className="font-bold text-gray-800">{event.participants}/{event.maxParticipants}人</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className={`h-2.5 rounded-full transition-all duration-500 ${progress >= 80 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-purple-400 to-purple-600'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {event.tags.map((tag, idx) => (<Tag key={idx} variant="purple">{tag}</Tag>))}
        </div>
        <Button variant={registered ? 'success' : isFull ? 'secondary' : 'primary'} className="w-full" onClick={() => !isFull && setRegistered(!registered)} disabled={isFull && !registered}>
          {registered ? '✓ 已报名' : isFull ? '活动已满' : '立即报名'}
        </Button>
      </div>
    </div>
  );
};

const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', maxParticipants: '', tags: '', category: '学术讲座' });

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.location) {
      alert('请填写必填项');
      return;
    }
    onSubmit(formData);
    setFormData({ title: '', description: '', date: '', location: '', maxParticipants: '', tags: '', category: '学术讲座' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建新活动" size="large">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">活动类型</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>学术讲座</option> <option>读书会</option> <option>工作坊</option>
              <option>社交活动</option> <option>项目路演</option> <option>技能培训</option>
            </select>
          </div>
          <Input label="最大参与人数" type="number" value={formData.maxParticipants} onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})} placeholder="限制人数（如：50）" />
        </div>
        <Input label="活动标题" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="一个吸引人的活动名称" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="活动时间" type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
          <Input label="活动地点" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="具体地址（如：图书馆报告厅）" icon={MapPin} required />
        </div>
        <TextArea label="活动描述" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="详细介绍活动内容、形式、预期收获等..." rows={6} />
        <Input label="活动标签" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="用空格分隔（如：AI 跨学科 创新）" />
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800">💡 活动小贴士：清晰的时间地点和详细的描述能吸引更多人参加</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} className="flex-1">创建活动</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== 活动页面 (主导出组件) ====================
export const EventsPage = () => {
  const [events, setEvents] = useState([
    { id: 1, title: '跨学科创新论坛：AI时代的教育变革', organizer: '王教授团队', date: '2025-10-15 14:00', location: '慧园行政楼报告厅', participants: 45, maxParticipants: 100, tags: ['学术讲座', '跨学科', 'AI'], description: '邀请教育学、计算机科学、心理学等多领域专家，探讨AI如何重塑教育形态', icon: '🎤' },
    { id: 2, title: '机器学习读书会 Vol.8', organizer: 'ML研究小组', date: '2025-10-08 19:00', location: '图书馆研讨室 304', participants: 18, maxParticipants: 20, tags: ['读书会', '机器学习', '深度学习'], description: '本周讨论《深度学习》第三章：优化算法。欢迎带着问题来交流！', icon: '📚' },
    { id: 3, title: '创业项目路演 Demo Day', organizer: '创新创业中心', date: '2025-10-20 15:00', location: '工学院创客空间', participants: 67, maxParticipants: 80, tags: ['创业', '路演', '项目'], description: '10个学生创业项目现场展示，投资人、创业导师现场点评指导', icon: '🚀' },
    { id: 4, title: 'Python数据分析工作坊', organizer: '数据科学社', date: '2025-10-12 14:00', location: '第一教学楼 205', participants: 35, maxParticipants: 40, tags: ['工作坊', 'Python', '数据分析'], description: '手把手教你用Pandas和Matplotlib进行数据分析，适合初学者', icon: '💻' }
  ]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const handleCreateEvent = (eventData) => {
    const newEvent = {
      id: Date.now(), title: eventData.title, organizer: '我',
      date: new Date(eventData.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      location: eventData.location, participants: 0, maxParticipants: parseInt(eventData.maxParticipants) || 100,
      tags: eventData.tags.split(' ').filter(t => t), description: eventData.description, icon: '📅'
    };
    setEvents([newEvent, ...events]);
    setShowCreateEvent(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">活动广场</h2>
          <p className="text-gray-600">发现精彩活动，结识志同道合的伙伴</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreateEvent(true)}>创建活动</Button>
      </div>
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {['all', 'lecture', 'workshop', 'social', 'competition'].map(type => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === type ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {type === 'all' && '全部活动'} {type === 'lecture' && '学术讲座'} {type === 'workshop' && '工作坊'}
              {type === 'social' && '社交活动'} {type === 'competition' && '竞赛路演'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (<EventCard key={event.id} event={event} />))}
      </div>
      <CreateEventModal isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSubmit={handleCreateEvent} />
    </div>
  );
};