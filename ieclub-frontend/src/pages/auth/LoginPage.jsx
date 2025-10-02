import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 导入新的导航工具
import { useAuth } from '../../store/AuthContext.jsx'; // 注意路径是 '../../'
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Mail } from 'lucide-react';


export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // <-- 使用新的导航工具
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.email) newErrors.email = '请输入邮箱';
    if (!formData.email.includes('@sustech.edu.cn') && !formData.email.includes('@mail.sustech.edu.cn')) {
    newErrors.email = '请使用南科大邮箱登录';
    }
    if (!formData.password) newErrors.password = '请输入密码';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login({
        id: 1,
        username: '张明',
        email: formData.email,
        avatar: '👨‍💻',
        major: '计算机科学与工程系',
        school: '南方科技大学',
        grade: '大三',
        reputation: 156,
        followers: 23,
        following: 45
      });
      setLoading(false);
      navigate('/'); // <-- 修改：登录成功后跳转到首页
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative z-10 backdrop-blur-sm bg-opacity-95">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce-slow">🎓</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            欢迎回来
          </h1>
          <p className="text-gray-600">登录IEclub继续你的学术之旅</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="南科大邮箱"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="your.id@sustech.edu.cn 或 @mail.sustech.edu.cn"
            error={errors.email}
            icon={Mail}
            required
          />
          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="输入密码"
            error={errors.password}
            required
          />

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">记住我</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline font-semibold">忘记密码?</a>
          </div>

          <Button variant="primary" className="w-full mb-4" loading={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">或</span>
          </div>
        </div>

        <p className="text-center text-gray-600">
          还没有账号？
          <button onClick={() => navigate('/register')} className="text-blue-600 font-semibold hover:underline ml-1">
            立即注册
          </button>
        </p>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-gray-500">
            仅限南方科技大学学生注册使用
          </p>
        </div>
      </div>
    </div>
  );
};