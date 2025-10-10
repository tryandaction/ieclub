// app.js
App({
  onLaunch(options) {
    console.log('小程序启动:', options);

    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      token: null,
      apiBaseUrl: 'https://www.ieclub.online/api/v1'
    };

    // 检查本地存储的登录状态
    this.checkLoginStatus();
  },

  onShow(options) {
    console.log('小程序显示:', options);
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 登录
  login(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
  },

  // 登出
  logout() {
    this.globalData.userInfo = null;
    this.globalData.token = null;

    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo;
  },

  // 获取token
  getToken() {
    return this.globalData.token;
  },

  // HTTP请求封装
  request(url, options = {}) {
    const token = this.getToken();

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBaseUrl}${url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    });
  },

  globalData: {
    userInfo: null,
    token: null
  }
});