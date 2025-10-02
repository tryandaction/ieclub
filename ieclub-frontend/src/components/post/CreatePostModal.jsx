import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { Image, Paperclip } from 'lucide-react';

export const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ title: '', content: '', tags: '', category: '学术讨论' });
  const [charCount, setCharCount] = useState(0);

  const handleContentChange = (e) => {
    setFormData({...formData, content: e.target.value});
    setCharCount(e.target.value.length);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容');
      return;
    }
    onSubmit(formData);
    setFormData({ title: '', content: '', tags: '', category: '学术讨论' });
    setCharCount(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="发布新帖子" size="large">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">分类</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>学术讨论</option> <option>项目招募</option> <option>资源分享</option>
              <option>问答求助</option> <option>活动预告</option> <option>经验分享</option>
            </select>
          </div>
        </div>
        <Input label="标题" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="一个吸引人的标题..." required />
        <div>
          <TextArea label="内容" value={formData.content} onChange={handleContentChange} placeholder="分享你的想法、项目或问题...\n\n提示：\n- 详细描述你的问题或想法\n- 使用换行让内容更易读\n- 添加相关的背景信息" rows={10} required />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">{charCount} 字</p>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="添加图片"><Image size={20} className="text-gray-600" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="添加附件"><Paperclip size={20} className="text-gray-600" /></button>
            </div>
          </div>
        </div>
        <Input label="标签" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="添加标签，用空格分隔（如：AI 机器学习 Python）" />
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">💡 发帖小贴士：清晰的标题和详细的描述能获得更多关注</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} className="flex-1">发布</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
        </div>
      </div>
    </Modal>
  );
};