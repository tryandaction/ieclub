// pages/post-detail/post-detail.js
const app = getApp();

Page({
  data: {
    post: null,
    comments: [],
    loading: true,
    commentContent: '',
    showCommentInput: false,
    postId: null
  },

  onLoad(options) {
    const postId = options.id;
    if (postId) {
      this.setData({ postId });
      this.loadPostDetail(postId);
    }
  },

  // 加载帖子详情
  loadPostDetail(postId) {
    this.setData({ loading: true });

    app.request(`/posts/${postId}`)
      .then(res => {
        console.log('获取帖子详情成功:', res);
        this.setData({
          post: res.post || {},
          comments: res.comments || []
        });
      })
      .catch(err => {
        console.error('获取帖子详情失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  // 显示评论输入框
  showCommentBox() {
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

    this.setData({
      showCommentInput: true
    });
  },

  // 隐藏评论输入框
  hideCommentBox() {
    this.setData({
      showCommentInput: false,
      commentContent: ''
    });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 提交评论
  submitComment() {
    const content = this.data.commentContent.trim();
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    app.request(`/posts/${this.data.postId}/comments`, {
      method: 'POST',
      data: { content }
    })
    .then(res => {
      console.log('评论成功:', res);
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });

      // 重新加载评论
      this.loadPostDetail(this.data.postId);
      this.hideCommentBox();
    })
    .catch(err => {
      console.error('评论失败:', err);
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      });
    });
  },

  // 点赞帖子
  likePost() {
    if (!app.getUserInfo()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    app.request(`/posts/${this.data.postId}/like`, {
      method: 'POST'
    })
    .then(res => {
      console.log('点赞成功:', res);
      const post = { ...this.data.post };
      post.isLiked = res.liked;
      post.likeCount = res.likeCount;

      this.setData({ post });

      wx.showToast({
        title: res.liked ? '点赞成功' : '取消点赞',
        icon: 'success'
      });
    })
    .catch(err => {
      console.error('点赞失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.current;
    const urls = e.currentTarget.dataset.urls;

    wx.previewImage({
      current: current,
      urls: urls
    });
  }
});