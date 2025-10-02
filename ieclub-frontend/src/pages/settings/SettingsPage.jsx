import React, { useState } from 'react';
import { Button } from '../../components/common/Button.jsx';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    showProfile: true,
    showEmail: false
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">设置</h2>
        <p className="text-gray-600">管理你的账号和隐私设置</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold mb-4">通知设置</h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: '邮件通知', desc: '接收重要活动和更新的邮件' },
              { key: 'pushNotifications', label: '推送通知', desc: '在浏览器中接收实时通知' },
              { key: 'weeklyDigest', label: '每周摘要', desc: '每周收到一封社区动态汇总邮件' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <button onClick={() => handleToggle(item.key)} className={`relative w-14 h-8 rounded-full transition-colors ${settings[item.key] ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings[item.key] ? 'transform translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold mb-4">隐私设置</h3>
          <div className="space-y-4">
            {[
              { key: 'showProfile', label: '公开个人资料', desc: '让其他用户查看你的完整资料' },
              { key: 'showEmail', label: '显示邮箱', desc: '在个人主页显示邮箱地址' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <button onClick={() => handleToggle(item.key)} className={`relative w-14 h-8 rounded-full transition-colors ${settings[item.key] ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings[item.key] ? 'transform translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-red-600">危险操作</h3>
          <div className="space-y-3">
            <Button variant="danger" className="w-full">注销账号</Button>
            <p className="text-sm text-gray-500 text-center">注销后数据将无法恢复</p>
          </div>
        </div>
      </div>
    </div>
  );
};