# IEclub 前端项目初始化脚本

# 1. 创建React项目（使用Vite）
npm create vite@latest ieclub-frontend -- --template react

# 2. 进入项目目录
cd ieclub-frontend

# 3. 安装核心依赖
npm install

# 4. 安装UI和工具库
npm install react-router-dom axios lucide-react
npm install -D tailwindcss postcss autoprefixer
npm install zustand react-hook-form zod

# 5. 初始化Tailwind CSS
npx tailwindcss init -p

# 6. 项目结构创建
mkdir -p src/{components,pages,services,store,hooks,utils,assets}
mkdir -p src/components/{common,layout,post,event,user}
mkdir -p src/pages/{auth,home,profile,events,match}

# 7. 启动开发服务器
cd C:/universe/GitHub_try/IEclub/ieclub-frontend
npm run dev