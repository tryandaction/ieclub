# TabBar 图标文件说明

这个目录用于存放小程序 tabBar 的图标文件。

## 需要的图标文件

如果你想为 tabBar 添加图标，需要创建以下文件：

- `home.png` - 首页图标 (81x81px 推荐)
- `home-active.png` - 首页选中状态图标 (81x81px 推荐)
- `events.png` - 活动图标 (81x81px 推荐)
- `events-active.png` - 活动选中状态图标 (81x81px 推荐)
- `posts.png` - 论坛图标 (81x81px 推荐)
- `posts-active.png` - 论坛选中状态图标 (81x81px 推荐)
- `profile.png` - 我的图标 (81x81px 推荐)
- `profile-active.png` - 我的选中状态图标 (81x81px 推荐)

## 图标要求

- 格式：PNG
- 尺寸：建议 81x81 像素
- 颜色：单色或双色，适配浅色和深色背景
- 风格：简洁现代，与应用整体风格一致

## 如何添加图标

1. 将图标文件放入此目录
2. 修改 `app.json` 中的 tabBar 配置，添加图标路径：

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png",
        "text": "首页"
      }
      // ... 其他 tabBar 项目
    ]
  }
}
```

## 当前状态

目前 tabBar 配置中没有使用图标，只显示文字，这样可以避免文件缺失错误。如果不需要图标，可以保持现状；如果需要图标，请按上述要求添加文件并修改配置。