# ============================================
# IEclub 前端项目初始化脚本 (v2 - 稳定版)
# ============================================

# 1. 创建React项目（使用Vite）
# ---------------------------------
# 使用 Vite 的 React 模板创建一个名为 ieclub-frontend 的新项目
npm create vite@latest ieclub-frontend -- --template react

# 2. 进入项目目录
# ---------------------------------
cd ieclub-frontend

# 3. 安装核心依赖
# ---------------------------------
# 注意：Vite 模板已包含 react, react-dom。这里安装其他应用级依赖。
npm install react-router-dom axios lucide-react zustand react-hook-form zod

# 4. 安装开发依赖 (包含 Tailwind CSS 及其伙伴)
# ---------------------------------
# 使用 -D 参数将其安装为开发依赖。
# 我们在这里明确指定了 tailwindcss v3 和兼容的 postcss/autoprefixer 版本，以确保稳定性。
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# 5. 初始化 Tailwind CSS (已修复和增强)
# ---------------------------------
# a. 运行官方初始化命令，这会自动创建 tailwind.config.js 和 postcss.config.js
npx tailwindcss init -p

# b. 【关键修复】自动覆盖 tailwind.config.js 文件，为其配置正确的 content 路径。
#    'content' 路径告诉 Tailwind 去哪里扫描你的代码以寻找样式类。
echo "/** @type {import('tailwindcss').Config} */
export default {
  content: [
    \"./index.html\",
    \"./src/**/*.{js,ts,jsx,tsx}\",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}" > tailwind.config.js

# c. 【关键修复】自动覆盖 postcss.config.js 文件，确保配置正确。
#    这是让 Tailwind 作为 PostCSS 插件工作的核心配置。
echo "export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}" > postcss.config.js

# d. 【关键修复】自动创建并覆盖 src/index.css 文件，注入 Tailwind 的指令。
#    这三行指令是激活 Tailwind 样式的“魔法咒语”。
echo "@tailwind base;
@tailwind components;
@tailwind utilities;" > src/index.css

# 6. 项目结构创建
# ---------------------------------
# 创建所有必要的子文件夹，以支持模块化的代码结构。
mkdir -p src/assets
mkdir -p src/components/{common,layout,post,event,user}
mkdir -p src/hooks
mkdir -p src/pages/{auth,home,profile,events,match,leaderboard,bookmarks,settings}
mkdir -p src/services
mkdir -p src/store
mkdir -p src/utils

# 7. 清理 Vite 模板的默认文件 (可选，但推荐)
# ---------------------------------
# 删除 Vite 模板自带的 App.css, App.jsx 和 assets，为我们的新结构做准备。
rm -f src/App.css src/assets/react.svg

# 8. 启动开发服务器
# ---------------------------------
echo "✅ 初始化完成！"
echo "下一步，请开始将你的组件和页面代码拆分到对应的文件夹中。"
echo "然后，在终端中运行 'npm run dev' 来启动项目。"
# npm run dev # 暂时注释掉，让用户手动启动