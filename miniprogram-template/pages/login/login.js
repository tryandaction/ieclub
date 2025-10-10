// pages/login/login.js
const app = getApp();

Page({
  data: {
    loading: false,
    userInfo: null
  },

  onLoad(options) {
    console.log('登录页面加载:', options);
  },

  onShow() {
    // 检查是否已经登录
    if (app.getUserInfo()) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 获取用户信息（新版小程序）
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        this.setData({
          userInfo: res.userInfo
        });
        this.wechatLogin(res.userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },

  // 微信登录（兼容旧版）
  getUserInfo() {
    wx.getUserInfo({
      success: (res) => {
        console.log('获取用户信息成功:', res);
        this.setData({
          userInfo: res.userInfo
        });
        this.wechatLogin(res.userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },

  // 执行微信登录
  wechatLogin(userInfo) {
    this.setData({ loading: true });

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 调用后端登录接口
          app.request('/wechat/miniprogram-login', {
            method: 'POST',
            data: {
              code: loginRes.code,
              userInfo: userInfo
            }
          }).then(res => {
            console.log('登录成功:', res);

            if (res.code === 200) {
              // 登录成功
              app.login(res.data.user, res.data.token);

              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });

              // 跳转到首页
              setTimeout(() => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }, 1500);

            } else if (res.code === 200 && res.data.needRegister) {
              // 需要注册
              wx.navigateTo({
                url: `/pages/register/register?openid=${res.data.openid}&sessionKey=${res.data.sessionKey}`
              });
            }

          }).catch(err => {
            console.error('登录失败:', err);
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            });
          }).finally(() => {
            this.setData({ loading: false });
          });

        } else {
          console.error('微信登录失败:', loginRes);
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: (err) => {
        console.error('wx.login失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 跳过登录（游客模式）
  skipLogin() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});