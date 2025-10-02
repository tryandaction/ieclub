#!/bin/bash

echo "🎓 IEclub Frontend Setup Script"
echo "================================"
echo ""

# 检查 Node.js 版本
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# 检查 npm 版本
echo "📦 Checking npm version..."
NPM_VERSION=$(npm -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm version: $NPM_VERSION"
echo ""

# 创建项目目录结构
echo "📁 Creating project structure..."
mkdir -p src/components/common
mkdir -p src/components/layout
mkdir -p src/components/post
mkdir -p src/components/event
mkdir -p src/components/user
mkdir -p src/pages/auth
mkdir -p src/pages/home
mkdir -p src/pages/profile
mkdir -p src/pages/events
mkdir -p src/pages/match
mkdir -p src/services
mkdir -p src/store
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/assets/images
mkdir -p src/assets/icons
mkdir -p public
echo "✅ Project structure created"
echo ""

# 安装依赖
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed successfully"
echo ""

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# API配置
VITE_API_BASE_URL=http://localhost:5000/api

# 应用配置
VITE_APP_NAME=IEclub
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_OCR=true
VITE_ENABLE_CHAT=false
EOF
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# 创建简单的 favicon
if [ ! -f public/favicon.ico ]; then
    echo "🎨 Creating favicon placeholder..."
    # 这里只创建一个提示文件，实际 favicon 需要设计
    touch public/favicon.ico
    echo "⚠️  Please replace public/favicon.ico with your actual favicon"
fi
echo ""

echo "================================"
echo "✨ Setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Copy your App.jsx code to src/App.jsx"
echo "  2. Make sure src/index.css is properly configured"
echo "  3. Run 'npm run dev' to start development server"
echo ""
echo "🚀 Quick commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run preview  - Preview production build"
echo "  npm run lint     - Run ESLint"
echo ""
echo "Happy coding! 🎉"