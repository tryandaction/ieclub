// pages/publish/publish.js
const app = getApp();

Page({
  data: {
    content: '',
    images: [],
    userInfo: null,
    submitting: false,
    contentLength: 0
  },

  onLoad() {
    console.log('发布页面加载');
    this.setData({
      userInfo: app.getUserInfo()
    });

    // 检查登录状态
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }
  },

  // 内容输入
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content: content,
      contentLength: content.length
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 9, // 最多9张图片
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res);

        const currentImages = this.data.images;
        const newImages = res.tempFilePaths;

        // 检查是否超过9张
        if (currentImages.length + newImages.length > 9) {
          wx.showToast({
            title: '最多只能选择9张图片',
            icon: 'none'
          });
          return;
        }

        this.setData({
          images: [...currentImages, ...newImages]
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.current;
    const images = this.data.images;

    wx.previewImage({
      current: current,
      urls: images
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);

    this.setData({
      images: images
    });
  },

  // 提交发布
  submitPost() {
    const content = this.data.content.trim();

    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    if (content.length < 5) {
      wx.showToast({
        title: '内容至少需要5个字符',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    // 如果有图片，先上传图片
    if (this.data.images.length > 0) {
      this.uploadImages().then(imageUrls => {
        return this.createPost(content, imageUrls);
      }).catch(err => {
        console.error('发布失败:', err);
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        });
      }).finally(() => {
        this.setData({ submitting: false });
      });
    } else {
      // 没有图片，直接发布
      this.createPost(content, []).catch(err => {
        console.error('发布失败:', err);
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        });
      }).finally(() => {
        this.setData({ submitting: false });
      });
    }
  },

  // 上传图片
  uploadImages() {
    return new Promise((resolve, reject) => {
      const imageUrls = [];
      let completed = 0;

      this.data.images.forEach((imagePath, index) => {
        wx.uploadFile({
          url: app.globalData.baseURL + '/upload',
          filePath: imagePath,
          name: 'image',
          success: (res) => {
            console.log('上传图片成功:', res);
            const data = JSON.parse(res.data);
            if (data.url) {
              imageUrls[index] = data.url;
            }

            completed++;
            if (completed === this.data.images.length) {
              resolve(imageUrls.filter(url => url));
            }
          },
          fail: (err) => {
            console.error('上传图片失败:', err);
            completed++;
            if (completed === this.data.images.length) {
              resolve(imageUrls.filter(url => url));
            }
          }
        });
      });
    });
  },

  // 创建帖子
  createPost(content, imageUrls) {
    return new Promise((resolve, reject) => {
      app.request('/posts', {
        method: 'POST',
        data: {
          content: content,
          images: imageUrls
        }
      }).then(res => {
        console.log('发布成功:', res);
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });

        // 延迟一点时间再返回，确保用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);

        resolve(res);
      }).catch(err => {
        console.error('发布失败:', err);
        reject(err);
      });
    });
  }
});