// app.js
App({
  globalData: {
    userInfo: null,
    baseURL: 'https://www.ieclub.online' // 请替换为您的后端域名
  },

  onLaunch() {
    console.log('小程序启动');
    // 不自动获取用户信息，需要用户手动触发
  },

  // 获取用户信息（新版微信小程序推荐方式）- 需要用户点击触发
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取用户信息成功:', res);
          this.setUserInfo(res.userInfo);
          resolve(res.userInfo);
        },
        fail: (err) => {
          console.log('获取用户信息失败:', err);
          reject(err);
        }
      });
    });
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  // 获取用户信息（示例方法）
  getUserInfo() {
    return this.globalData.userInfo;
  },

  // 设置用户信息（示例方法）
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
  },

  // 封装请求方法（示例）
  request(url, options = {}) {
    const baseURL = this.globalData.baseURL;

    return new Promise((resolve, reject) => {
      wx.request({
        url: baseURL + url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': options.auth ? `Bearer ${options.auth}` : '',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      });
    });
  }
});