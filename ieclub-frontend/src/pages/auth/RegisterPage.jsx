import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Mail } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate(); // <-- 使用新的导航工具
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '南方科技大学',
    department: '',
    major: '',
    grade: '',
    interests: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const departments = [
    '计算机科学与工程系', '电子与电气工程系', '数学系', '物理系', '化学系', '生物系',
    '材料科学与工程系', '金融系', '商学院', '人文社科学院', '环境科学与工程学院', '海洋科学与工程系'
  ];

  const interestOptions = [
    'AI/机器学习', '数据科学', 'Web开发', '移动开发', '区块链', '量子计算', '生物信息学',
    '材料科学', '金融科技', '创业', '设计', '摄影', '音乐', '运动', '阅读', '写作'
  ];

  const handleInterestToggle = (interest) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    setFormData({...formData, interests: newInterests});
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = '请输入用户名';
    if (!formData.email) newErrors.email = '请输入邮箱';
    if (!formData.email.includes('@sustech.edu.cn') && !formData.email.includes('@mail.sustech.edu.cn')) {
      newErrors.email = '请使用南科大邮箱注册';
    }
    if (!formData.password) newErrors.password = '请输入密码';
    if (formData.password.length < 8) newErrors.password = '密码至少8位';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '两次密码不一致';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.department) newErrors.department = '请选择院系';
    if (!formData.major) newErrors.major = '请输入专业';
    if (!formData.grade) newErrors.grade = '请选择年级';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.interests.length === 0) {
      alert('请至少选择一个兴趣标签');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      register(formData);
      setLoading(false);
      navigate('/'); // <-- 修改：注册成功后跳转到首页
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative z-10 backdrop-blur-sm bg-opacity-95">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            加入IEclub
          </h1>
          <p className="text-gray-600">开启跨学科交流之旅</p>
        </div>

        <div className="flex justify-between mb-8">
          {[1, 2, 3].map(num => (
            <div key={num} className="flex-1 flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= num ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {num}
              </div>
              {num < 3 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${step > num ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">基本信息</h3>
              <Input label="用户名" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="选择一个用户名" error={errors.username} required />
              <Input label="南科大邮箱" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="your.id@sustech.edu.cn 或 @mail.sustech.edu.cn"error={errors.email} icon={Mail} required />
              <Input label="密码" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="至少8位字符" error={errors.password} required />
              <Input label="确认密码" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} placeholder="再次输入密码" error={errors.confirmPassword} required />
              <Button type="button" variant="primary" onClick={handleNext} className="w-full">下一步</Button>
            </div>
          )}
          {step === 2 && (
             <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">学业信息</h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">院系 <span className="text-red-500">*</span></label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                  <option value="">选择院系</option>
                  {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>
              <Input label="专业" value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} placeholder="你的专业方向" error={errors.major} required />
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">年级 <span className="text-red-500">*</span></label>
                <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                  <option value="">选择年级</option>
                  <option value="大一">大一</option> <option value="大二">大二</option> <option value="大三">大三</option> <option value="大四">大四</option>
                  <option value="研一">研一</option> <option value="研二">研二</option> <option value="研三">研三</option> <option value="博士">博士</option>
                </select>
                {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">上一步</Button>
                <Button type="button" variant="primary" onClick={handleNext} className="flex-1">下一步</Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">兴趣标签</h3>
              <p className="text-gray-600 mb-4">选择你感兴趣的领域，帮助我们为你推荐志同道合的伙伴</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {interestOptions.map(interest => (
                  <button key={interest} type="button" onClick={() => handleInterestToggle(interest)} className={`px-4 py-2 rounded-full font-semibold transition-all ${formData.interests.includes(interest) ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-4">已选择 {formData.interests.length} 个标签</p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">上一步</Button>
                <Button variant="primary" className="flex-1" loading={loading}>{loading ? '注册中...' : '完成注册'}</Button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-gray-600 mt-6">
          已有账号？
          <button onClick={() => navigate('/login')} className="text-purple-600 font-semibold hover:underline ml-1">
            立即登录
          </button>
        </p>
      </div>
    </div>
  );
};