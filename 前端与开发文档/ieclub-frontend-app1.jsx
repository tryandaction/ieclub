import React, { useState, createContext, useContext, useEffect } from 'react';
import { Home, Users, Calendar, User, Bell, Search, Plus, Heart, MessageCircle, Share2, Camera, FileText, LogOut, Edit3, MapPin, Clock, UserPlus, Mail, TrendingUp, Award, BookOpen, Zap, Globe, Shield, Star, Filter, Send, Image, Paperclip, ChevronDown, ChevronUp, Eye, BarChart3, School } from 'lucide-react';

// ==================== 状态管理 ====================
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('ieclub_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('ieclub_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ieclub_user');
  };

  const register = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      avatar: '👨‍💻',
      createdAt: new Date().toISOString(),
      reputation: 0,
      followers: 0,
      following: 0
    };
    login(newUser);
    return newUser;
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('ieclub_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== 通用组件 ====================
const Button = ({ children, variant = 'primary', onClick, className = '', icon: Icon, disabled, loading }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
    success: 'bg-green-500 text-white hover:bg-green-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={18} />
      )}
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, error, icon: Icon, required }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const TextArea = ({ label, value, onChange, placeholder, rows = 4, error, required }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'default' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`bg-white rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp`}>
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-gray-600 rotate-45"></div>
                <div className="w-5 h-0.5 bg-gray-600 -rotate-45 absolute"></div>
              </div>
            </div>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Tag = ({ children, variant = 'blue', onRemove, interactive }) => {
  const variants = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <span className={`${variants[variant]} px-3 py-1.5 rounded-full text-sm inline-flex items-center gap-2 border ${interactive ? 'cursor-pointer hover:shadow-sm transition-all' : ''}`}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-white hover:bg-opacity-50 rounded-full p-0.5 transition-colors">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-0.5 bg-current rotate-45"></div>
              <div className="w-3 h-0.5 bg-current -rotate-45 absolute"></div>
            </div>
          </div>
        </button>
      )}
    </span>
  );
};

const Avatar = ({ src, alt, size = 'md', status }) => {
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-32 h-32 text-6xl'
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white shadow-md`}>
        {src || alt}
      </div>
      {status && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      )}
    </div>
  );
};

const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// ==================== 布局组件 ====================
const Navbar = ({ onNavigate, currentPage }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, type: 'like', user: '李思', content: '赞了你的帖子', time: '5分钟前', unread: true },
    { id: 2, type: 'comment', user: '王浩', content: '评论了你的帖子', time: '1小时前', unread: true },
    { id: 3, type: 'follow', user: '陈晓', content: '关注了你', time: '2小时前', unread: false }
  ];

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-panel')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="text-3xl transform group-hover:scale-110 transition-transform">🎓</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IEclub
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">南方科技大学学生社区</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索帖子、活动、用户..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Tooltip content="通知">
                  <button 
                    className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell size={22} />
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      2
                    </span>
                  </button>
                </Tooltip>

                {showNotifications && (
                  <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-bold text-lg">通知</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <Avatar src="👤" size="sm" />
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold">{notif.user}</span> {notif.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t">
                      <button className="text-blue-600 text-sm font-semibold hover:underline">查看全部</button>
                    </div>
                  </div>
                )}

                <div 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => onNavigate('profile')}
                >
                  <Avatar src={user.avatar} size="sm" status="online" />
                  <span className="font-semibold text-gray-700 hidden lg:block">{user.username}</span>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onNavigate('login')}>登录</Button>
                <Button variant="primary" onClick={() => onNavigate('register')}>注册</Button>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
              <span className="w-full h-0.5 bg-gray-600 rounded"></span>
            </div>
          </button>
        </div>

        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 animate-slideDown">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
            {!isAuthenticated && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onNavigate('login')} className="flex-1">登录</Button>
                <Button variant="primary" onClick={() => onNavigate('register')} className="flex-1">注册</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const Sidebar = ({ currentPage, onNavigate }) => {
  const { isAuthenticated, logout, user } = useAuth();

  const menuItems = [
    { id: 'home', icon: Home, label: '首页', badge: null },
    { id: 'trending', icon: TrendingUp, label: '热门', badge: 'HOT' },
    { id: 'events', icon: Calendar, label: '活动', badge: null },
    { id: 'match', icon: Users, label: '兴趣匹配', badge: 'NEW' },
    { id: 'leaderboard', icon: Award, label: '排行榜', badge: null },
  ];

  const userMenuItems = [
    { id: 'profile', icon: User, label: '我的主页' },
    { id: 'bookmarks', icon: BookOpen, label: '我的收藏' },
    { id: 'settings', icon: Shield, label: '设置' },
  ];

  return (
    <aside className="hidden lg:block w-64 space-y-2">
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} size="md" status="online" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{user.username}</p>
                <p className="text-sm text-gray-500 truncate">{user.major}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="font-bold text-gray-800">{user.followers || 0}</p>
                <p className="text-xs text-gray-500">粉丝</p>
              </div>
              <div className="text-center border-l border-r">
                <p className="font-bold text-gray-800">{user.following || 0}</p>
                <p className="text-xs text-gray-500">关注</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">{user.reputation || 0}</p>
                <p className="text-xs text-gray-500">声望</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">加入IEclub社区</p>
            <Button variant="primary" onClick={() => onNavigate('register')} className="w-full">
              立即注册
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group ${
                currentPage === item.id 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={currentPage === item.id ? '' : 'text-gray-500 group-hover:text-blue-500'} />
                {item.label}
              </div>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  currentPage === item.id ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isAuthenticated && (
        <>
          <div className="border-t my-4"></div>
          <div className="space-y-1">
            {userMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-white hover:bg-gray-50 text-gray-700 transition-all"
                >
                  <Icon size={20} className="text-gray-500" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-white hover:bg-red-50 text-red-600 transition-all"
            >
              <LogOut size={20} />
              退出登录
            </button>
          </div>
        </>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <School size={20} className="text-blue-600" />
          <p className="font-bold text-gray-800">校区交流</p>
        </div>
        <p className="text-sm text-gray-600 mb-3">即将支持跨校区、跨学校交流功能</p>
        <Button variant="outline" className="w-full text-sm">了解更多</Button>
      </div>
    </aside>
  );
};

// ==================== 认证页面 ====================
const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.email) newErrors.email = '请输入邮箱';
    if (!formData.email.includes('@sustech.edu.cn') && !formData.email.includes('@mail.sustech.edu.cn')) {
      newErrors.email = '请使用南科大邮箱注册';
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
      onNavigate('home');
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
            placeholder="your.id@sustech.edu.cn"
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
          <button onClick={() => onNavigate('register')} className="text-blue-600 font-semibold hover:underline ml-1">
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

const RegisterPage = ({ onNavigate }) => {
  const { register } = useAuth();
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
    '计算机科学与工程系',
    '电子与电气工程系',
    '数学系',
    '物理系',
    '化学系',
    '生物系',
    '材料科学与工程系',
    '金融系',
    '商学院',
    '人文社科学院',
    '环境科学与工程学院',
    '海洋科学与工程系'
  ];

  const interestOptions = [
    'AI/机器学习', '数据科学', 'Web开发', '移动开发', '区块链',
    '量子计算', '生物信息学', '材料科学', '金融科技', '创业',
    '设计', '摄影', '音乐', '运动', '阅读', '写作'
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
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
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
      onNavigate('home');
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
              <Input
                label="用户名"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="选择一个用户名"
                error={errors.username}
                required
              />
              <Input
                label="南科大邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your.id@sustech.edu.cn"
                error={errors.email}
                icon={Mail}
                required
              />
              <Input
                label="密码"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="至少8位字符"
                error={errors.password}
                required
              />
              <Input
                label="确认密码"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="再次输入密码"
                error={errors.confirmPassword}
                required
              />
              <Button type="button" variant="primary" onClick={handleNext} className="w-full">
                下一步
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">学业信息</h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  院系 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">选择院系</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>
              <Input
                label="专业"
                value={formData.major}
                onChange={(e) => setFormData({...formData, major: e.target.value})}
                placeholder="你的专业方向"
                error={errors.major}
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  年级 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">选择年级</option>
                  <option value="大一">大一</option>
                  <option value="大二">大二</option>
                  <option value="大三">大三</option>
                  <option value="大四">大四</option>
                  <option value="研一">研一</option>
                  <option value="研二">研二</option>
                  <option value="研三">研三</option>
                  <option value="博士">博士</option>
                </select>
                {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  上一步
                </Button>
                <Button type="button" variant="primary" onClick={handleNext} className="flex-1">
                  下一步
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">兴趣标签</h3>
              <p className="text-gray-600 mb-4">选择你感兴趣的领域，帮助我们为你推荐志同道合的伙伴</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-4">已选择 {formData.interests.length} 个标签</p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  上一步
                </Button>
                <Button variant="primary" className="flex-1" loading={loading}>
                  {loading ? '注册中...' : '完成注册'}
                </Button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-gray-600 mt-6">
          已有账号？
          <button onClick={() => onNavigate('login')} className="text-purple-600 font-semibold hover:underline ml-1">
            立即登录
          </button>
        </p>
      </div>
    </div>
  );
};

// ==================== 帖子组件 ====================
const PostCard = ({ post, onLike, onComment, onShare, detailed = false }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(detailed);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    setLiked(!liked);
    onLike && onLike(post.id, !liked);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment && onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Avatar src={post.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-bold text-lg text-gray-800 hover:text-blue-600 cursor-pointer">{post.author}</span>
              <span className="text-gray-500 text-sm">· {post.major}</span>
              <span className="text-gray-400 text-sm">· {post.time}</span>
              {post.verified && (
                <Tooltip content="已认证用户">
                  <Shield size={16} className="text-blue-500" fill="currentColor" />
                </Tooltip>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 hover:text-blue-600 cursor-pointer leading-tight">
              {post.title}
            </h3>
            <p className="text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.images.map((img, idx) => (
                  <div key={idx} className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg"></div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4 flex-wrap">
              <Tag variant="blue" interactive>{post.category}</Tag>
              {post.tags.map((tag, idx) => (
                <Tag key={idx} variant="gray" interactive>#{tag}</Tag>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-gray-600 pt-3 border-t">
              <div className="flex gap-6">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-all hover:scale-110 ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
                  <span className="font-semibold">{post.likes + (liked ? 1 : 0)}</span>
                </button>
                <button 
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 hover:text-blue-500 transition-all hover:scale-110"
                >
                  <MessageCircle size={20} strokeWidth={2} />
                  <span className="font-semibold">{post.comments}</span>
                </button>
                <button 
                  onClick={() => onShare && onShare(post.id)}
                  className="flex items-center gap-2 hover:text-green-500 transition-all hover:scale-110"
                >
                  <Share2 size={20} strokeWidth={2} />
                  <span className="font-semibold">分享</span>
                </button>
              </div>
              <button 
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex items-center gap-2 transition-all hover:scale-110 ${bookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
              >
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="border-t bg-gray-50 p-6">
          <div className="space-y-4 mb-4">
            {post.commentsList && post.commentsList.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar src={comment.avatar} size="sm" />
                <div className="flex-1">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm mb-1">{comment.author}</p>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <button className="hover:text-blue-600">{comment.time}</button>
                    <button className="hover:text-blue-600">回复</button>
                    <button className="hover:text-red-600">点赞 {comment.likes}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button variant="primary" icon={Send} onClick={handleComment}>
              发送
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: '学术讨论'
  });
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
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>学术讨论</option>
              <option>项目招募</option>
              <option>资源分享</option>
              <option>问答求助</option>
              <option>活动预告</option>
              <option>经验分享</option>
            </select>
          </div>
        </div>
        
        <Input
          label="标题"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="一个吸引人的标题..."
          required
        />
        
        <div>
          <TextArea
            label="内容"
            value={formData.content}
            onChange={handleContentChange}
            placeholder="分享你的想法、项目或问题...

提示：
- 详细描述你的问题或想法
- 使用换行让内容更易读
- 添加相关的背景信息"
            rows={10}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">{charCount} 字</p>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="添加图片">
                <Image size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="添加附件">
                <Paperclip size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <Input
          label="标签"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          placeholder="添加标签，用空格分隔（如：AI 机器学习 Python）"
        />

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">💡 发帖小贴士：清晰的标题和详细的描述能获得更多关注</p>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            发布
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== 首页 ====================
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: '张明',
      avatar: '👨‍💻',
      major: '计算机科学与工程系',
      title: '寻找对AI+教育感兴趣的小伙伴',
      content: '我正在做一个基于大模型的个性化学习助手项目，希望找到对教育技术感兴趣的同学一起合作。\n\n目前已完成：\n✅ 原型设计\n✅ 基础架构搭建\n✅ 数据收集方案\n\n需要的技能：Python、机器学习、前端开发',
      category: '项目招募',
      tags: ['AI', '教育科技', '项目合作'],
      likes: 23,
      comments: 8,
      time: '2小时前',
      verified: true,
      commentsList: [
        { id: 1, author: '李思', avatar: '👩', content: '很有意思的项目！我对教育科技也很感兴趣', likes: 3, time: '1小时前' }
      ]
    },
    {
      id: 2,
      author: '李思',
      avatar: '👩‍🔬',
      major: '生物医学工程系',
      title: '分享：如何从零开始学习Python数据分析',
      content: '最近整理了一套适合生物医学背景同学的Python学习路径，包含实战案例和常用库介绍。\n\n包含内容：\n📊 NumPy & Pandas基础\n📈 数据可视化（Matplotlib/Seaborn）\n🧬 生物信息学实战案例\n\n资源已上传到GitHub，欢迎star！',
      category: '资源分享',
      tags: ['Python', '数据分析', '跨学科'],
      likes: 45,
      comments: 15,
      time: '5小时前',
      verified: true,
      images: [1, 2],
      commentsList: []
    },
    {
      id: 3,
      author: '王浩',
      avatar: '🧑‍🎨',
      major: '工业设计',
      title: '【资源分享】超全UI设计工具合集',
      content: '整理了一份设计师必备工具清单！\n\n🎨 设计工具：Figma、Sketch、Adobe XD\n✨ 动效工具：Principle、ProtoPie\n🌈 配色：Coolors、Adobe Color\n📦 素材：Unsplash、Iconfinder\n\n所有工具都附带了教程链接~',
      category: '资源分享',
      tags: ['设计', '工具', '资源'],
      likes: 67,
      comments: 22,
      time: '1天前',
      commentsList: []
    }
  ]);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const handleCreatePost = (postData) => {
    const newPost = {
      id: Date.now(),
      author: '张明',
      avatar: '👨‍💻',
      major: '计算机科学与工程系',
      title: postData.title,
      content: postData.content,
      category: postData.category,
      tags: postData.tags.split(' ').filter(t => t),
      likes: 0,
      comments: 0,
      time: '刚刚',
      verified: true,
      commentsList: []
    };
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">🎓</div>
        <h2 className="text-3xl font-bold mb-4">欢迎来到IEclub</h2>
        <p className="text-gray-600 mb-8">登录后查看完整内容</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
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
        <Button variant="primary" icon={Plus} onClick={() => setShowCreatePost(true)}>
          发布帖子
        </Button>
        <Button variant="outline" icon={TrendingUp}>
          热门话题
        </Button>
        <Button variant="ghost" icon={Filter}>
          筛选
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'academic', 'project', 'resource', 'qa'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === filterType 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {filterType === 'all' && '全部'}
                {filterType === 'academic' && '学术讨论'}
                {filterType === 'project' && '项目招募'}
                {filterType === 'resource' && '资源分享'}
                {filterType === 'qa' && '问答求助'}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="latest">最新发布</option>
            <option value="hot">最热</option>
            <option value="comments">最多评论</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

// ==================== 活动页面 ====================
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
          <p className="flex items-center gap-2">
            <User size={16} className="text-gray-400" /> 
            <span className="font-semibold">{event.organizer}</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> 
            {event.date}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" /> 
            {event.location}
          </p>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-semibold">报名进度</span>
            <span className="font-bold text-gray-800">{event.participants}/{event.maxParticipants}人</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                progress >= 80 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-purple-400 to-purple-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {event.tags.map((tag, idx) => (
            <Tag key={idx} variant="purple">{tag}</Tag>
          ))}
        </div>
        
        <Button 
          variant={registered ? 'success' : isFull ? 'secondary' : 'primary'}
          className="w-full"
          onClick={() => !isFull && setRegistered(!registered)}
          disabled={isFull && !registered}
        >
          {registered ? '✓ 已报名' : isFull ? '活动已满' : '立即报名'}
        </Button>
      </div>
    </div>
  );
};

const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: '',
    tags: '',
    category: '学术讲座'
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.location) {
      alert('请填写必填项');
      return;
    }
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      maxParticipants: '',
      tags: '',
      category: '学术讲座'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建新活动" size="large">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">活动类型</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>学术讲座</option>
              <option>读书会</option>
              <option>工作坊</option>
              <option>社交活动</option>
              <option>项目路演</option>
              <option>技能培训</option>
            </select>
          </div>
          <Input
            label="最大参与人数"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
            placeholder="限制人数（如：50）"
          />
        </div>

        <Input
          label="活动标题"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="一个吸引人的活动名称"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="活动时间"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <Input
            label="活动地点"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="具体地址（如：图书馆报告厅）"
            icon={MapPin}
            required
          />
        </div>

        <TextArea
          label="活动描述"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="详细介绍活动内容、形式、预期收获等..."
          rows={6}
        />
        
        <Input
          label="活动标签"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          placeholder="用空格分隔（如：AI 跨学科 创新）"
        />

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800">💡 活动小贴士：清晰的时间地点和详细的描述能吸引更多人参加</p>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            创建活动
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const EventsPage = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: '跨学科创新论坛：AI时代的教育变革',
      organizer: '王教授团队',
      date: '2025-10-15 14:00',
      location: '慧园行政楼报告厅',
      participants: 45,
      maxParticipants: 100,
      tags: ['学术讲座', '跨学科', 'AI'],
      description: '邀请教育学、计算机科学、心理学等多领域专家，探讨AI如何重塑教育形态',
      icon: '🎤'
    },
    {
      id: 2,
      title: '机器学习读书会 Vol.8',
      organizer: 'ML研究小组',
      date: '2025-10-08 19:00',
      location: '图书馆研讨室 304',
      participants: 18,
      maxParticipants: 20,
      tags: ['读书会', '机器学习', '深度学习'],
      description: '本周讨论《深度学习》第三章：优化算法。欢迎带着问题来交流！',
      icon: '📚'
    },
    {
      id: 3,
      title: '创业项目路演 Demo Day',
      organizer: '创新创业中心',
      date: '2025-10-20 15:00',
      location: '工学院创客空间',
      participants: 67,
      maxParticipants: 80,
      tags: ['创业', '路演', '项目'],
      description: '10个学生创业项目现场展示，投资人、创业导师现场点评指导',
      icon: '🚀'
    },
    {
      id: 4,
      title: 'Python数据分析工作坊',
      organizer: '数据科学社',
      date: '2025-10-12 14:00',
      location: '第一教学楼 205',
      participants: 35,
      maxParticipants: 40,
      tags: ['工作坊', 'Python', '数据分析'],
      description: '手把手教你用Pandas和Matplotlib进行数据分析，适合初学者',
      icon: '💻'
    }
  ]);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const handleCreateEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      title: eventData.title,
      organizer: '我',
      date: new Date(eventData.date).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      location: eventData.location,
      participants: 0,
      maxParticipants: parseInt(eventData.maxParticipants) || 100,
      tags: eventData.tags.split(' ').filter(t => t),
      description: eventData.description,
      icon: '📅'
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
        <Button variant="primary" icon={Plus} onClick={() => setShowCreateEvent(true)}>
          创建活动
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {['all', 'lecture', 'workshop', 'social', 'competition'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterType === type 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {type === 'all' && '全部活动'}
              {type === 'lecture' && '学术讲座'}
              {type === 'workshop' && '工作坊'}
              {type === 'social' && '社交活动'}
              {type === 'competition' && '竞赛路演'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
};

// ==================== 兴趣匹配页面 ====================
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
                <button 
                  onClick={() => setExpanded(true)}
                  className="text-blue-600 text-sm font-semibold hover:underline"
                >
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
              <Button 
                variant={added ? 'success' : 'primary'}
                onClick={handleAdd}
                icon={added ? null : UserPlus}
                disabled={added}
                className="flex-1"
              >
                {added ? '✓ 已添加' : '添加好友'}
              </Button>
              <Button variant="outline" className="flex-1">
                查看主页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchPage = () => {
  const [recommendedUsers] = useState([
    { 
      id: 1,
      name: '陈晓', 
      avatar: '🧑‍🎓', 
      major: '金融数学与金融工程系',
      school: '南方科技大学',
      bio: '对数据分析和量化投资感兴趣，寻找技术背景的合作伙伴探讨金融科技创新',
      interests: ['数据分析', '量化交易', 'Python', '金融科技', '机器学习'], 
      projects: ['加密货币套利策略研究'],
      match: 85 
    },
    { 
      id: 2,
      name: '刘洋', 
      avatar: '👨‍🏫', 
      major: '物理系',
      school: '南方科技大学',
      bio: '研究量子计算与AI的交叉领域，希望找到志同道合的研究者共同探索前沿科技',
      interests: ['量子计算', 'AI', '科研', '理论物理', '算法优化'], 
      projects: ['量子机器学习算法实现'],
      match: 78 
    },
    { 
      id: 3,
      name: '赵欣', 
      avatar: '👩‍💼', 
      major: '工业设计',
      school: '南方科技大学',
      bio: '专注于教育产品的用户体验设计，热爱跨学科交流，相信设计能改变世界',
      interests: ['UX设计', '教育科技', '产品设计', '跨学科', '心理学'], 
      projects: ['在线教育平台UI/UX重设计'],
      match: 72 
    },
    {
      id: 4,
      name: '李明',
      avatar: '👨‍💼',
      major: '环境科学与工程学院',
      school: '南方科技大学',
      bio: '关注可持续发展和环境保护，希望用科技手段解决环境问题',
      interests: ['环境科学', '数据可视化', 'GIS', '可持续发展'],
      projects: ['深圳市空气质量监测与预测系统'],
      match: 68
    }
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
        {recommendedUsers.map(user => (
          <UserMatchCard key={user.id} user={user} onAddFriend={handleAddFriend} />
        ))}
      </div>

      <div className="text-center py-8">
        <Button variant="outline">加载更多推荐</Button>
      </div>
    </div>
  );
};

// ==================== 个人主页 ====================
const ProfilePage = () => {
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
    {
      id: 1,
      title: 'AI学习助手',
      description: '基于大模型的个性化学习推荐系统，已服务100+用户',
      status: 'ongoing',
      tags: ['AI', 'Python', 'Education'],
      stars: 23
    },
    {
      id: 2,
      title: '跨学科知识图谱',
      description: '连接不同学科知识点的可视化平台，获校级创新奖',
      status: 'completed',
      tags: ['知识图谱', 'D3.js', '可视化'],
      stars: 45
    }
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
            <Button variant="secondary" icon={Edit3} onClick={() => setIsEditing(true)}>
              编辑资料
            </Button>
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === tab 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'posts' && '我的帖子'}
              {tab === 'projects' && '我的项目'}
              {tab === 'ocr' && 'OCR识别'}
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
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        project.status === 'ongoing' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
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
                    {project.tags.map((tag, idx) => (
                      <Tag key={idx} variant="gray">{tag}</Tag>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" icon={Plus} className="w-full">
                添加新项目
              </Button>
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOCRUpload}
                  className="hidden"
                  id="ocr-upload"
                  disabled={ocrProcessing}
                />
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
                <p className="text-sm text-blue-800">
                  <strong>使用技巧：</strong> 拍照时保持文字清晰、光线充足，识别准确率更高
                </p>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">识别历史</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>暂无识别记录</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== 主应用 ====================
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    if (currentPage === 'login') return <LoginPage onNavigate={setCurrentPage} />;
    if (currentPage === 'register') return <RegisterPage onNavigate={setCurrentPage} />;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 min-w-0">
              {currentPage === 'home' && <HomePage />}
              {currentPage === 'trending' && <HomePage />}
              {currentPage === 'events' && <EventsPage />}
              {currentPage === 'match' && <MatchPage />}
              {currentPage === 'profile' && <ProfilePage />}
              {currentPage === 'leaderboard' && <LeaderboardPage />}
              {currentPage === 'bookmarks' && <BookmarksPage />}
              {currentPage === 'settings' && <SettingsPage />}
            </main>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthProvider>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-blob { animation: blob 7s infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {renderPage()}
    </AuthProvider>
  );
}

// ==================== 排行榜页面 ====================
const LeaderboardPage = () => {
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === tab 
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'reputation' && '🏆 声望榜'}
              {tab === 'contribution' && '⭐ 贡献榜'}
              {tab === 'newbie' && '🌱 新人榜'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'reputation' && (
            <div className="space-y-3">
              {reputationLeaders.map((user, idx) => (
                <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${
                  idx < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-full ${
                    idx === 0 ? 'bg-yellow-400 text-white' :
                    idx === 1 ? 'bg-gray-300 text-white' :
                    idx === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
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
                    <div>
                      <p className="text-lg font-bold text-blue-600">{user.posts}</p>
                      <p className="text-xs text-gray-600">帖子</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{user.comments}</p>
                      <p className="text-xs text-gray-600">评论</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{user.helpful}</p>
                      <p className="text-xs text-gray-600">有用</p>
                    </div>
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

// ==================== 收藏页面 ====================
const BookmarksPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">我的收藏</h2>
        <p className="text-gray-600">你收藏的帖子和活动</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            全部
          </button>
          <button className="px-4 py-2 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">
            帖子
          </button>
          <button className="px-4 py-2 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700">
            活动
          </button>
        </div>
      </div>

      <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
        <Bookmark size={64} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg mb-2">还没有收藏内容</p>
        <p className="text-gray-500 text-sm">在浏览时点击收藏按钮保存你喜欢的内容</p>
      </div>
    </div>
  );
};

// ==================== 设置页面 ====================
const SettingsPage = () => {
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
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings[item.key] ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings[item.key] ? 'transform translate-x-6' : ''
                  }`}></div>
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
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings[item.key] ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings[item.key] ? 'transform translate-x-6' : ''
                  }`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-4 text-red-600">危险操作</h3>
          <div className="space-y-3">
            <Button variant="danger" className="w-full">
              注销账号
            </Button>
            <p className="text-sm text-gray-500 text-center">注销后数据将无法恢复</p>
          </div>
        </div>
      </div>
    </div>
  );
};