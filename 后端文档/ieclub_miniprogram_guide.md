# IEclub 微信小程序开发方案

## 🎯 技术选型

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **原生小程序** | 性能最好、体积小 | 开发效率低、无法复用Web代码 | ⭐⭐⭐ |
| **Taro (React)** | 代码复用高、生态好 | 体积稍大 | ⭐⭐⭐⭐⭐ |
| **uni-app (Vue)** | 多端支持、学习成本低 | 性能一般 | ⭐⭐⭐⭐ |

**推荐使用 Taro 3 + React**，原因：
- ✅ 与Web端技术栈一致（React）
- ✅ 可以复用大量组件和逻辑
- ✅ 支持TypeScript
- ✅ 社区活跃，文档完善

## 📱 小程序架构

```
IEclub小程序
├── 登录方式: 微信授权 + 邮箱绑定
├── 核心功能: 与Web版基本一致
├── 特色功能: 
│   ├── 小程序码分享
│   ├── 模板消息通知
│   ├── 微信支付（未来）
│   └── 位置服务
└── 数据同步: 统一后端API
```

## 🚀 快速开始

### 1. 安装Taro CLI
```bash
npm install -g @tarojs/cli
```

### 2. 创建项目
```bash
taro init ieclub-miniprogram
```

选择配置：
- 框架：React
- TypeScript：是
- CSS预处理器：Sass
- 模板：默认模板

### 3. 项目结构
```
ieclub-miniprogram/
├── src/
│   ├── app.config.ts          # 小程序配置
│   ├── app.tsx                # 入口文件
│   ├── app.scss               # 全局样式
│   │
│   ├── pages/                 # 页面
│   │   ├── index/             # 首页
│   │   ├── login/             # 登录页
│   │   ├── posts/             # 帖子列表
│   │   ├── post-detail/       # 帖子详情
│   │   ├── events/            # 活动列表
│   │   ├── event-detail/      # 活动详情
│   │   ├── profile/           # 个人主页
│   │   └── match/             # 兴趣匹配
│   │
│   ├── components/            # 组件
│   │   ├── PostCard/          # 帖子卡片
│   │   ├── EventCard/         # 活动卡片
│   │   ├── UserCard/          # 用户卡片
│   │   └── TabBar/            # 底部导航
│   │
│   ├── services/              # API服务
│   │   ├── api.ts             # API配置
│   │   ├── auth.ts            # 认证服务
│   │   ├── post.ts            # 帖子服务
│   │   └── event.ts           # 活动服务
│   │
│   ├── store/                 # 状态管理
│   │   ├── auth.ts
│   │   └── user.ts
│   │
│   ├── utils/                 # 工具函数
│   │   ├── request.ts         # 请求封装
│   │   ├── storage.ts         # 本地存储
│   │   └── validators.ts      # 验证函数
│   │
│   └── assets/                # 资源文件
│       ├── images/
│       └── icons/
│
├── config/                    # 配置文件
│   ├── dev.js                 # 开发环境
│   └── prod.js                # 生产环境
│
├── project.config.json        # 微信小程序配置
└── package.json
```

## 📝 核心代码

### src/app.config.ts
```typescript
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/posts/index',
    'pages/post-detail/index',
    'pages/events/index',
    'pages/event-detail/index',
    'pages/profile/index',
    'pages/match/index',
    'pages/create-post/index',
    'pages/create-event/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#3b82f6',
    navigationBarTitleText: 'IEclub',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f5f5'
  },
  tabBar: {
    color: '#666666',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/events/index',
        text: '活动',
        iconPath: 'assets/icons/event.png',
        selectedIconPath: 'assets/icons/event-active.png'
      },
      {
        pagePath: 'pages/match/index',
        text: '匹配',
        iconPath: 'assets/icons/match.png',
        selectedIconPath: 'assets/icons/match-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于展示附近的活动'
    }
  }
})
```

### src/utils/request.ts
```typescript
import Taro from '@tarojs/taro'

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'https://ieclub.sustech.edu.cn/api/v1'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
}

export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {} } = options

  // 获取token
  const token = Taro.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      }
    })

    const { statusCode, data: resData } = response

    if (statusCode === 200) {
      if (resData.code === 200) {
        return resData.data
      } else {
        Taro.showToast({
          title: resData.message || '请求失败',
          icon: 'none'
        })
        throw new Error(resData.message)
      }
    } else if (statusCode === 401) {
      // 未授权，跳转登录
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('user')
      Taro.reLaunch({ url: '/pages/login/index' })
      throw new Error('未授权')
    } else {
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
      throw new Error('网络请求失败')
    }
  } catch (error) {
    console.error('请求错误:', error)
    throw error
  }
}

export const get = <T = any>(url: string, data?: any) => {
  return request<T>({ url, method: 'GET', data })
}

export const post = <T = any>(url: string, data?: any) => {
  return request<T>({ url, method: 'POST', data })
}

export const put = <T = any>(url: string, data?: any) => {
  return request<T>({ url, method: 'PUT', data })
}

export const del = <T = any>(url: string, data?: any) => {
  return request<T>({ url, method: 'DELETE', data })
}
```

### src/services/auth.ts
```typescript
import Taro from '@tarojs/taro'
import { post } from '../utils/request'

export interface LoginResult {
  user: any
  token: string
}

// 微信登录
export const wechatLogin = async (): Promise<LoginResult | { needBind: boolean; openid: string }> => {
  // 1. 获取微信登录code
  const { code } = await Taro.login()
  
  // 2. 发送到后端
  const result = await post('/auth/wechat-login', { code })
  
  if (result.needBind) {
    // 需要绑定邮箱
    return { needBind: true, openid: result.openid }
  } else {
    // 登录成功
    Taro.setStorageSync('token', result.token)
    Taro.setStorageSync('user', result.user)
    return result
  }
}

// 绑定邮箱
export const bindEmail = async (data: {
  openid: string
  email: string
  password: string
  username: string
  department?: string
  major?: string
  grade?: string
}): Promise<LoginResult> => {
  const result = await post('/auth/bind-email', data)
  Taro.setStorageSync('token', result.token)
  Taro.setStorageSync('user', result.user)
  return result
}

// 退出登录
export const logout = () => {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('user')
  Taro.reLaunch({ url: '/pages/login/index' })
}
```

### src/pages/login/index.tsx
```typescript
import { View, Button, Form, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { wechatLogin, bindEmail } from '../../services/auth'
import './index.scss'

export default function Login() {
  const [needBind, setNeedBind] = useState(false)
  const [openid, setOpenid] = useState('')
  const [loading, setLoading] = useState(false)

  // 微信一键登录
  const handleWechatLogin = async () => {
    try {
      setLoading(true)
      const result = await wechatLogin()
      
      if ('needBind' in result && result.needBind) {
        // 需要绑定邮箱
        setNeedBind(true)
        setOpenid(result.openid)
        Taro.showToast({
          title: '请绑定南科大邮箱',
          icon: 'none'
        })
      } else {
        // 登录成功
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      }
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 绑定邮箱
  const handleBindEmail = async (e) => {
    const { email, password, username } = e.detail.value
    
    if (!email || !password || !username) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      await bindEmail({ openid, email, password, username })
      
      Taro.showToast({
        title: '绑定成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (error) {
      console.error('绑定失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <View className='logo'>🎓</View>
        <View className='title'>IEclub</View>
        <View className='subtitle'>南方科技大学学生社区</View>
      </View>

      {!needBind ? (
        <View className='login-content'>
          <Button
            type='primary'
            className='login-btn'
            loading={loading}
            onClick={handleWechatLogin}
          >
            微信一键登录
          </Button>
          <View className='tips'>仅限南方科技大学学生使用</View>
        </View>
      ) : (
        <View className='bind-content'>
          <View className='bind-title'>绑定南科大邮箱</View>
          <Form onSubmit={handleBindEmail}>
            <View className='form-item'>
              <Input
                name='username'
                placeholder='用户名'
                className='input'
              />
            </View>
            <View className='form-item'>
              <Input
                name='email'
                placeholder='南科大邮箱'
                className='input'
              />
            </View>
            <View className='form-item'>
              <Input
                name='password'
                type='password'
                placeholder='设置密码（至少8位）'
                className='input'
              />
            </View>
            <Button
              type='primary'
              formType='submit'
              className='bind-btn'
              loading={loading}
            >
              完成绑定
            </Button>
          </Form>
        </View>
      )}
    </View>
  )
}
```

### src/pages/index/index.tsx
```typescript
import { View, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import { getPosts } from '../../services/post'
import PostCard from '../../components/PostCard'
import './index.scss'

export default function Index() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useLoad(() => {
    loadPosts()
  })

  usePullDownRefresh(() => {
    refreshPosts()
  })

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await getPosts({ page, pageSize: 10 })
      setPosts([...posts, ...data.items])
      setHasMore(data.pagination.page < data.pagination.totalPages)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshPosts = async () => {
    try {
      const data = await getPosts({ page: 1, pageSize: 10 })
      setPosts(data.items)
      setPage(1)
      setHasMore(data.pagination.page < data.pagination.totalPages)
      Taro.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      Taro.stopPullDownRefresh()
    }
  }

  const handleCreatePost = () => {
    Taro.navigateTo({ url: '/pages/create-post/index' })
  }

  return (
    <View className='index-page'>
      <View className='page-header'>
        <View className='header-title'>IEclub</View>
        <View className='header-subtitle'>跨学科交流社区</View>
      </View>

      <ScrollView
        className='post-list'
        scrollY
        onScrollToLower={hasMore ? loadPosts : undefined}
      >
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {loading && <View className='loading'>加载中...</View>}
        {!hasMore && posts.length > 0 && <View className='no-more'>没有更多了</View>}
      </ScrollView>

      <View className='create-btn' onClick={handleCreatePost}>
        +
      </View>
    </View>
  )
}
```

### src/components/PostCard/index.tsx
```typescript
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { likePost } from '../../services/post'
import './index.scss'

interface PostCardProps {
  post: any
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)

  const handleLike = async () => {
    try {
      await likePost(post.id)
      setLiked(!liked)
      setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleNavigate = () => {
    Taro.navigateTo({
      url: `/pages/post-detail/index?id=${post.id}`
    })
  }

  return (
    <View className='post-card' onClick={handleNavigate}>
      <View className='post-header'>
        <View className='author-info'>
          <Text className='author-avatar'>{post.author.avatar}</Text>
          <View className='author-detail'>
            <Text className='author-name'>{post.author.username}</Text>
            <Text className='author-major'>{post.author.major}</Text>
          </View>
        </View>
        <Text className='post-time'>{post.time}</Text>
      </View>

      <View className='post-content'>
        <Text className='post-title'>{post.title}</Text>
        <Text className='post-text'>{post.content}</Text>
      </View>

      {post.tags && post.tags.length > 0 && (
        <View className='post-tags'>
          {post.tags.map((tag, index) => (
            <Text key={index} className='tag'>#{tag}</Text>
          ))}
        </View>
      )}

      <View className='post-footer'>
        <View className='action-item' onClick={(e) => {
          e.stopPropagation()
          handleLike()
        }}>
          <Text className={`icon ${liked ? 'liked' : ''}`}>❤</Text>
          <Text className='count'>{likeCount}</Text>
        </View>
        <View className='action-item'>
          <Text className='icon'>💬</Text>
          <Text className='count'>{post.commentCount}</Text>
        </View>
        <View className='action-item'>
          <Text className='icon'>👁</Text>
          <Text className='count'>{post.viewCount}</Text>
        </View>
      </View>
    </View>
  )
}
```

## 🎨 小程序特色功能

### 1. 分享功能
```typescript
// 在页面中添加分享配置
useShareAppMessage(() => {
  return {
    title: 'IEclub - 南科大学生社区',
    path: '/pages/index/index',
    imageUrl: 'https://your-cdn.com/share-image.jpg'
  }
})

useShareTimeline(() => {
  return {
    title: 'IEclub - 南科大学生社区',
    query: '',
    imageUrl: 'https://your-cdn.com/share-image.jpg'
  }
})
```

### 2. 模板消息
```typescript
// 后端发送订阅消息
const sendSubscribeMessage = async (openid, data) => {
  const access_token = await getAccessToken()
  
  await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
    {
      touser: openid,
      template_id: 'your_template_id',
      page: 'pages/event-detail/index?id=' + data.eventId,
      data: {
        thing1: { value: data.eventTitle },
        time2: { value: data.eventTime },
        thing3: { value: data.eventLocation }
      }
    }
  )
}
```

### 3. 位置服务
```typescript
// 获取用户位置
const getLocation = async () => {
  try {
    const res = await Taro.getLocation({
      type: 'gcj02'
    })
    return {
      latitude: res.latitude,
      longitude: res.longitude
    }
  } catch (error) {
    console.error('获取位置失败:', error)
    return null
  }
}

// 打开地图
const openLocation = (latitude: number, longitude: number, name: string) => {
  Taro.openLocation({
    latitude,
    longitude,
    name,
    scale: 18
  })
}
```

### 4. 扫码功能
```typescript
const scanQRCode = async () => {
  try {
    const res = await Taro.scanCode({
      scanType: ['qrCode']
    })
    // 处理扫码结果
    console.log('扫码结果:', res.result)
  } catch (error) {
    console.error('扫码失败:', error)
  }
}
```

## 📦 构建与发布

### 1. 开发环境运行
```bash
# 编译到微信小程序
npm run dev:weapp

# 打开微信开发者工具
# 导入项目目录：dist/
```

### 2. 生产环境构建
```bash
npm run build:weapp
```

### 3. 上传代码
在微信开发者工具中：
1. 点击"上传"按钮
2. 填写版本号和项目备注
3. 上传成功后在微信公众平台提交审核

### 4. 提交审核
在微信公众平台：
1. 登录小程序管理后台
2. 版本管理 → 开发版本
3. 提交审核
4. 填写审核信息
5. 等待审核（一般1-3天）

## 🔧 项目配置

### config/dev.js
```javascript
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE_URL': '"http://localhost:5000/api/v1"'
  },
  mini: {},
  h5: {}
}
```

### config/prod.js
```javascript
module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE_URL': '"https://ieclub.sustech.edu.cn/api/v1"'
  },
  mini: {
    // 生产环境压缩配置
    minifyOptions: {
      mangle: {
        toplevel: true
      }
    }
  },
  h5: {
    publicPath: '/'
  }
}
```

## 📋 审核注意事项

### 小程序类目
选择：**教育 > 在线教育**

### 服务范围
- 仅限南方科技大学在校学生使用
- 需要提供学校邮箱认证

### 用户隐私保护指引
必须在代码中声明使用的隐私接口：
```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于展示附近的活动"
    }
  }
}
```

### 服务器域名配置
在小程序管理后台配置：
- **request合法域名**: https://ieclub.sustech.edu.cn
- **uploadFile合法域名**: https://ieclub-files.oss-cn-shenzhen.aliyuncs.com
- **downloadFile合法域名**: https://ieclub-files.oss-cn-shenzhen.aliyuncs.com

## 🎯 性能优化

### 1. 分包加载
```typescript
// app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/profile/index'
  ],
  subPackages: [
    {
      root: 'subpages/post',
      pages: [
        'detail/index',
        'create/index'
      ]
    },
    {
      root: 'subpages/event',
      pages: [
        'detail/index',
        'create/index'
      ]
    }
  ],
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['subpages/post']
    }
  }
})
```

### 2. 图片优化
```typescript
// 使用webp格式
<Image 
  src='https://cdn.ieclub.com/image.webp'
  mode='aspectFill'
  lazyLoad
/>

// 图片压缩
<Image 
  src='https://cdn.ieclub.com/image.jpg?x-oss-process=image/resize,w_750'
/>
```

### 3. 请求优化
```typescript
// 请求防抖
import { debounce } from 'lodash'

const searchPosts = debounce(async (keyword: string) => {
  const results = await search(keyword)
  setSearchResults(results)
}, 300)
```

## 🔄 Web端与小程序代码复用

### 共享组件
```typescript
// components/shared/PostCard.tsx
// 可以同时在Web和小程序中使用

import { View, Text } from '@tarojs/components'
// 或者 import { View, Text } from 'react'

export default function PostCard({ post }) {
  return (
    <View className='post-card'>
      <Text>{post.title}</Text>
    </View>
  )
}
```

### 共享API服务
```typescript
// services/api/post.ts
// 统一的API接口，不同平台使用不同的request实现

export const getPosts = async (params) => {
  return request.get('/posts', params)
}
```

## 📊 数据统计

### 微信小程序数据分析
在小程序管理后台可以看到：
- 用户访问趋势
- 页面访问路径
- 用户画像分析
- 实时数据

### 自定义数据上报
```typescript
// 页面访问统计
Taro.reportAnalytics('page_view', {
  page_name: 'post_detail',
  post_id: postId
})

// 事件统计
Taro.reportAnalytics('button_click', {
  button_name: 'like',
  post_id: postId
})
```

## ✅ 开发检查清单

### 开发阶段
- [ ] 完成核心页面开发
- [ ] API接口对接
- [ ] 微信登录集成
- [ ] 分享功能实现
- [ ] 本地测试通过

### 提交审核前
- [ ] 代码压缩优化
- [ ] 图片资源优化
- [ ] 服务器域名配置
- [ ] 隐私政策完善
- [ ] 用户协议准备
- [ ] 测试账号准备

### 审核通过后
- [ ] 设置体验版
- [ ] 灰度发布测试
- [ ] 全量发布
- [ ] 数据监控
- [ ] 用户反馈收集

## 🚀 上线时间规划

- **Week 1-2**: 基础框架搭建 + 核心页面开发
- **Week 3**: API对接 + 微信登录
- **Week 4**: 功能完善 + 测试优化
- **Week 5**: 提交审核
- **Week 6**: 正式上线

**预计总开发时间: 6周**

## 📞 技术支持

遇到问题可以参考：
- [Taro官方文档](https://taro-docs.jd.com/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [IEclub开发文档](https://docs.ieclub.com)

---

**完成后，IEclub将同时拥有Web版和小程序版，为南科大学生提供全方位的服务！** 🎉