# IEclub 微信小程序模板

## 📋 项目简介

这是IEclub论坛平台的微信小程序版本，提供了完整的移动端论坛体验，包括帖子浏览、发布、活动管理、用户互动等功能。

## 🚀 快速开始

### 1. 环境准备

#### 1.1 申请微信小程序账号
1. 访问 [微信小程序官网](https://mp.weixin.qq.com/)
2. 注册小程序账号（需要营业执照或个人身份证）
3. 获取AppID和AppSecret

#### 1.2 开发工具安装
1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 使用小程序AppID登录开发者工具

### 2. 项目配置

#### 2.1 导入项目
1. 打开微信开发者工具
2. 选择「导入项目」
3. 填入项目路径和AppID

#### 2.2 配置域名白名单
在微信小程序管理后台配置合法域名：

**request合法域名**：
```
https://www.ieclub.online
```

**uploadFile合法域名**：
```
https://www.ieclub.online
```

**downloadFile合法域名**：
```
https://www.ieclub.online
```

#### 2.3 后端配置
确保后端服务器已配置小程序相关环境变量：

```bash
# 微信小程序配置
WECHAT_MINIPROGRAM_APPID=your-miniprogram-appid
WECHAT_MINIPROGRAM_SECRET=your-miniprogram-secret
```

### 3. 开发指南

#### 3.1 项目结构
```
miniprogram/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置
├── app.wxss              # 小程序样式
├── sitemap.json          # 搜索优化
├── pages/                # 页面目录
│   ├── index/           # 首页（帖子列表）
│   ├── profile/         # 个人主页
│   ├── posts/           # 帖子详情
│   ├── events/          # 活动页面
│   └── login/           # 登录页面
├── components/           # 组件目录
├── utils/               # 工具库
├── services/            # API服务
└── config/              # 配置文件
```

#### 3.2 核心功能开发

##### 用户认证
小程序使用微信授权登录：

```javascript
// 在登录页面调用
wx.login({
  success: (res) => {
    if (res.code) {
      // 调用后端登录接口
      app.request('/wechat/miniprogram-login', {
        method: 'POST',
        data: { code: res.code, userInfo }
      });
    }
  }
});
```

##### 数据请求
使用封装的request方法：

```javascript
const app = getApp();

// 获取帖子列表
app.request('/posts?page=1&limit=20').then(res => {
  console.log('帖子列表:', res.posts);
});

// 发布帖子
app.request('/posts', {
  method: 'POST',
  data: {
    title: '帖子标题',
    content: '帖子内容',
    category: '学术讨论'
  }
});
```

##### 图片上传
```javascript
wx.chooseImage({
  success: (res) => {
    wx.uploadFile({
      url: 'https://www.ieclub.online/api/posts',
      filePath: res.tempFilePaths[0],
      name: 'images',
      header: {
        'Authorization': `Bearer ${app.getToken()}`
      }
    });
  }
});
```

## 📱 页面开发

### 首页（帖子列表）
- 下拉刷新
- 上拉加载更多
- 帖子点赞、收藏
- 跳转到帖子详情

### 个人主页
- 用户信息展示
- 我的帖子
- 我的收藏
- 设置选项

### 活动页面
- 活动列表
- 活动报名
- 活动详情

### 发布页面
- 富文本编辑
- 图片上传
- 分类选择

## 🔧 部署发布

### 1. 代码审核
1. 在微信小程序后台提交审核
2. 等待审核通过（通常1-3天）

### 2. 版本发布
1. 审核通过后，点击「发布」
2. 选择发布到体验版或正式版

### 3. 用户访问
用户可以通过以下方式访问小程序：
- 微信搜索小程序名称
- 扫描二维码
- 从H5分享链接跳转

## 🚨 注意事项

### 1. 开发限制
- 小程序有包体积限制（主包不能超过2MB）
- API调用频率限制
- 图片大小和数量限制

### 2. 审核要点
- 确保内容合规
- 不要诱导分享
- 保护用户隐私
- 明确授权用途

### 3. 性能优化
- 图片懒加载
- 数据分页加载
- 缓存常用数据
- 减少请求次数

## 📊 数据统计

小程序提供详细的数据统计：
- 访问量（PV/UV）
- 用户留存
- 页面停留时长
- 分享转化率

## 🔒 安全注意

1. **用户数据保护**：
   - 敏感信息加密存储
   - 最小化授权范围
   - 明确告知数据用途

2. **网络安全**：
   - 使用HTTPS
   - 验证服务器证书
   - 防止中间人攻击

3. **内容安全**：
   - 敏感词过滤
   - 图片内容审核
   - 用户举报机制

## 📞 技术支持

开发过程中遇到问题：

1. 查看微信小程序官方文档
2. 参考微信开发者社区
3. 检查后端API日志
4. 在GitHub Issues中反馈

## 🎯 下一步计划

1. **基础版本**：完成核心功能开发
2. **高级功能**：添加支付、直播等
3. **性能优化**：提升加载速度和用户体验
4. **数据分析**：集成统计和分析功能

祝你小程序开发顺利！🚀