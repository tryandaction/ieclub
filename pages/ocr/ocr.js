// pages/ocr/ocr.js
const app = getApp();

Page({
  data: {
    imagePath: '',
    recognizedText: '',
    isRecognizing: false,
    history: []
  },

  onLoad() {
    console.log('OCR页面加载');
    this.loadHistory();
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res);
        this.setData({
          imagePath: res.tempFilePaths[0]
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

  // 使用后端API识别文字
  async recognizeText() {
    if (!this.data.imagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isRecognizing: true });

    wx.showLoading({
      title: '识别中...',
    });

    try {
      // 获取用户token
      const userInfo = app.globalData.userInfo;
      if (!userInfo || !userInfo.token) {
        wx.hideLoading();
        this.setData({ isRecognizing: false });
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 将图片转换为base64
      const base64 = await this.getImageBase64(this.data.imagePath);

      // 调用后端OCR API
      const result = await app.request('/ocr/recognize', {
        method: 'POST',
        auth: userInfo.token,
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          image: base64,
          accurate: false
        }
      });

      wx.hideLoading();

      if (result && result.text) {
        this.setData({
          recognizedText: result.text,
          isRecognizing: false
        });

        // 保存到历史记录
        this.saveToHistory(result.text);

        wx.showToast({
          title: '识别成功',
          icon: 'success'
        });
      } else {
        this.setData({ isRecognizing: false });
        wx.showToast({
          title: '未识别到文字',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      wx.hideLoading();
      this.setData({ isRecognizing: false });

      wx.showToast({
        title: '识别失败：' + (error.message || '网络错误'),
        icon: 'none'
      });
    }
  },

  // 将图片转换为base64格式
  getImageBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          console.error('读取图片失败:', err);
          reject(err);
        }
      });
    });
  },

  // 保存识别结果到本地历史
  saveToHistory(text) {
    const history = wx.getStorageSync('ocr_history') || [];
    const record = {
      id: Date.now(),
      text: text,
      imagePath: this.data.imagePath,
      time: new Date().toLocaleString()
    };

    history.unshift(record);

    // 只保留最近50条记录
    if (history.length > 50) {
      history.splice(50);
    }

    wx.setStorageSync('ocr_history', history);
    this.setData({ history: history });
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('ocr_history') || [];
    this.setData({ history: history });
  },

  // 复制文字到剪贴板
  copyText() {
    if (!this.data.recognizedText) {
      wx.showToast({
        title: '没有可复制的文字',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.recognizedText,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('ocr_history');
          this.setData({ history: [] });
          wx.showToast({
            title: '清空成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除单条历史记录
  deleteHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const history = this.data.history;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          history.splice(index, 1);
          wx.setStorageSync('ocr_history', history);
          this.setData({ history: history });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 预览图片
  previewImage() {
    if (this.data.imagePath) {
      wx.previewImage({
        current: this.data.imagePath,
        urls: [this.data.imagePath]
      });
    }
  }
});