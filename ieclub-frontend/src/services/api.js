// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api/v1'
    : 'https://www.ieclub.online/api/v1'
);

// 创建API请求函数
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // 如果有认证token，添加到请求头
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

// API方法封装
export const api = {
  // 认证相关
  auth: {
    login: (credentials) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (userData) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    getCurrentUser: () => apiRequest('/auth/me'),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  },

  // 帖子相关
  posts: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/posts${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/posts/${id}`),
    create: (postData) => apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
    update: (id, postData) => apiRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    }),
    delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
    like: (id) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
    bookmark: (id) => apiRequest(`/posts/${id}/bookmark`, { method: 'POST' }),
  },

  // 用户相关
  users: {
    getById: (id) => apiRequest(`/users/${id}`),
    update: (userData) => apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    getBookmarks: () => apiRequest('/users/me/bookmarks'),
  },

  // 活动相关
  events: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/events/${id}`),
    register: (id) => apiRequest(`/events/${id}/register`, { method: 'POST' }),
  },

  // OCR相关
  ocr: {
    recognize: (formData) => apiRequest('/ocr/recognize', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置multipart/form-data
      body: formData,
    }),
  },

  // 匹配相关
  match: {
    getRecommendations: () => apiRequest('/match/recommendations'),
    getInterests: () => apiRequest('/match/interests'),
  },
};

export default api;