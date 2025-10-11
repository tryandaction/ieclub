// pages/index/index.js
const app = getApp();

Page({
  data: {
    posts: [],
    loading: false,
    refreshing: false,
    page: 1,
    hasMore: true,
    userInfo: null
  },

  onLoad() {
    console.log('首页加载');
    this.setData({
      userInfo: app.getUserInfo()
    });
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.posts.length === 0) {
      this.loadPosts();
    }
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({
      refreshing: true,
      page: 1,
      posts: [],
      hasMore: true
    });
    this.loadPosts();
  },

  onReachBottom() {
    console.log('上拉加载更多');
    if (this.data.hasMore && !this.data.loading) {
      this.loadMorePosts();
    }
  },

  // 加载帖子列表
  loadPosts() {
    this.setData({ loading: true });

    app.request(`/posts?page=${this.data.page}&limit=20`)
      .then(res => {
        console.log('获取帖子成功:', res);

        this.setData({
          posts: res.posts || [],
          hasMore: res.hasMore && (res.posts || []).length === 20,
          page: 2
        });

      }).catch(err => {
        console.error('获取帖子失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });

        // 如果是第一页加载失败，显示空状态
        if (this.data.page === 1) {
          this.setData({
            posts: []
          });
        }
      }).finally(() => {
        this.setData({ loading: false, refreshing: false });
        wx.stopPullDownRefresh();
      });
  },

  // 加载更多帖子
  loadMorePosts() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    app.request(`/posts?page=${this.data.page}&limit=20`)
      .then(res => {
        console.log('加载更多帖子成功:', res);

        this.setData({
          posts: [...this.data.posts, ...(res.posts || [])],
          hasMore: res.hasMore && (res.posts || []).length === 20,
          page: this.data.page + 1
        });

      }).catch(err => {
        console.error('加载更多失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }).finally(() => {
        this.setData({ loading: false });
      });
  },

  // 跳转到帖子详情
  goToPost(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${postId}`
    });
  },

  // 跳转到发布帖子
  goToPublish() {
    if (!app.getUserInfo()) {
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

    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  },

  // 跳转到OCR识别
  goToOCR() {
    wx.navigateTo({
      url: '/pages/ocr/ocr'
    });
  },

  // 点赞帖子
  likePost(e) {
    e.stopPropagation();

    if (!app.getUserInfo()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const postId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;

    app.request(`/posts/${postId}/like`, {
      method: 'POST'
    }).then(res => {
      console.log('点赞成功:', res);

      const posts = [...this.data.posts];
      posts[index].isLiked = res.liked;
      posts[index].likeCount = res.likeCount;

      this.setData({ posts });

      wx.showToast({
        title: res.liked ? '点赞成功' : '取消点赞',
        icon: 'success'
      });

    }).catch(err => {
      console.error('点赞失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  // 预览图片
  previewImage(e) {
    e.stopPropagation();
    const current = e.currentTarget.dataset.current;
    const urls = e.currentTarget.dataset.urls;

    wx.previewImage({
      current: current,
      urls: urls
    });
  }
});