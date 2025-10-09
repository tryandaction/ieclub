#!/bin/bash

echo "🚀 IEclub Backend Initialization"
echo "================================"
echo ""

# 创建项目目录
echo "📁 Creating project structure..."
mkdir -p src/{config,middleware,models,controllers,routes,services,utils,db}
mkdir -p src/db/{migrations,seeds}
mkdir -p logs
mkdir -p tests/{unit,integration}

# 创建必要的文件
touch src/server.js
touch src/app.js
touch src/config/database.js
touch src/config/jwt.js
touch src/middleware/auth.js
touch src/middleware/errorHandler.js
touch src/middleware/rateLimiter.js
touch src/middleware/validator.js
touch src/models/index.js
touch src/utils/logger.js
touch src/utils/validators.js
touch .env
touch .gitignore
touch README.md

echo "✅ Project structure created"
echo ""

echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

# 初始化package.json（如果不存在）
if [ ! -f "package.json" ]; then
    npm init -y
fi

# 安装生产依赖
npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet \
    express-rate-limit express-validator morgan compression \
    axios nodemailer winston multer ioredis

# 安装开发依赖
npm install -D nodemon jest supertest eslint

echo ""
echo "✅ Dependencies installed"
echo ""

echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/

# Misc
.cache/
temp/
EOF

echo "✅ .gitignore created"
echo ""

echo "================================"
echo "✨ Initialization completed!"
echo ""
echo "📚 Next steps:"
echo "  1. Edit .env file with your database credentials"
echo "  2. Install PostgreSQL if not installed"
echo "  3. Run: npm run dev"
echo ""
echo "Happy coding! 🎉"