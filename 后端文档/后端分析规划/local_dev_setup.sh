#!/bin/bash

# ==================== 本地开发环境快速启动脚本 ====================
# 使用方法：chmod +x local-setup.sh && ./local-setup.sh

echo "🚀 IEclub 本地开发环境设置"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========== 步骤1：检查环境 ==========
echo -e "${BLUE}📋 步骤 1/6: 检查开发环境${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请访问 https://nodejs.org 下载安装"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js 已安装: ${NODE_VERSION}${NC}"
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm 已安装: ${NPM_VERSION}${NC}"
fi

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL 未安装${NC}"
    echo "请安装 PostgreSQL:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt install postgresql"
    echo "  - Windows: https://www.postgresql.org/download/windows/"
    read -p "按回车继续..."
else
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✅ PostgreSQL 已安装: ${PSQL_VERSION}${NC}"
fi

echo ""

# ========== 步骤2：创建项目目录 ==========
echo -e "${BLUE}📁 步骤 2/6: 创建项目目录结构${NC}"

mkdir -p src/{config,middleware,models,controllers,routes,services,utils}
mkdir -p logs uploads tests

echo -e "${GREEN}✅ 目录结构创建完成${NC}"
echo ""

# ========== 步骤3：创建 package.json ==========
echo -e "${BLUE}📦 步骤 3/6: 创建 package.json${NC}"

if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "ieclub-backend",
  "version": "1.0.0",
  "description": "IE Club 学生交流论坛后端API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "lint": "eslint src/**/*.js"
  },
  "keywords": ["forum", "student", "education"],
  "author": "Your Name",
  "license": "MIT"
}
EOF
    echo -e "${GREEN}✅ package.json 创建完成${NC}"
else
    echo -e "${YELLOW}⚠️  package.json 已存在，跳过${NC}"
fi

echo ""

# ========== 步骤4：安装依赖 ==========
echo -e "${BLUE}📥 步骤 4/6: 安装项目依赖${NC}"
echo "这可能需要几分钟..."

# 检查是否已安装依赖
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules 已存在${NC}"
    read -p "是否重新安装依赖? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "跳过依赖安装"
    else
        rm -rf node_modules package-lock.json
        npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet \
          express-rate-limit express-validator morgan compression \
          axios nodemailer winston multer ali-oss ioredis
        npm install -D nodemon jest supertest eslint sequelize-cli
        echo -e "${GREEN}✅ 依赖安装完成${NC}"
    fi
else
    npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet \
      express-rate-limit express-validator morgan compression \
      axios nodemailer winston multer ali-oss ioredis
    npm install -D nodemon jest supertest eslint sequelize-cli
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
fi

echo ""

# ========== 步骤5：创建环境变量文件 ==========
echo -e "${BLUE}⚙️  步骤 5/6: 配置环境变量${NC}"

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# ==================== 本地开发环境配置 ====================

# 服务器配置
NODE_ENV=development
PORT=5000
API_VERSION=v1

# 数据库配置（本地PostgreSQL）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=20
DB_POOL_MIN=2

# JWT配置（开发用，随意设置）
JWT_SECRET=dev_secret_key_for_local_development_only_12345
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev_refresh_secret_key_67890
JWT_REFRESH_EXPIRES_IN=30d

# CORS配置（允许本地前端）
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174

# 邮箱配置（开发环境可留空）
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@ieclub.com

# 允许的邮箱域名（开发时可以放宽限制）
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,gmail.com,qq.com,163.com

# 文件上传配置（本地存储）
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# 阿里云OSS配置（开发环境留空，使用本地存储）
ALI_OSS_REGION=
ALI_OSS_ACCESS_KEY_ID=
ALI_OSS_ACCESS_KEY_SECRET=
ALI_OSS_BUCKET=

# Redis配置（可选，开发环境可以不用）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OCR配置（开发环境留空，使用mock数据）
OCR_PROVIDER=baidu
BAIDU_OCR_APP_ID=
BAIDU_OCR_API_KEY=
BAIDU_OCR_SECRET_KEY=

# 日志配置
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# 限流配置（开发环境不限流）
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_WINDOW=15
AUTH_RATE_LIMIT_MAX=100

# 前端URL（本地）
FRONTEND_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✅ .env 文件创建完成${NC}"
    echo -e "${YELLOW}💡 请根据实际情况修改 DB_PASSWORD${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在，跳过${NC}"
fi

# 创建 .gitignore
if [ ! -f ".gitignore" ]; then
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

# Uploads
uploads/*
!uploads/.gitkeep

# Misc
.cache/
temp/
EOF
    touch uploads/.gitkeep
    echo -e "${GREEN}✅ .gitignore 创建完成${NC}"
fi

echo ""

# ========== 步骤6：配置数据库 ==========
echo -e "${BLUE}🗄️  步骤 6/6: 配置数据库${NC}"

# 读取数据库密码
read -p "请输入 PostgreSQL 密码 (默认: postgres): " DB_PASS
DB_PASS=${DB_PASS:-postgres}

# 更新 .env 文件中的密码
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
else
    # Linux
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
fi

# 尝试创建数据库
echo "创建开发数据库..."
PGPASSWORD=$DB_PASS psql -U postgres -h localhost -c "CREATE DATABASE ieclub_dev;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库 ieclub_dev 创建成功${NC}"
else
    echo -e "${YELLOW}⚠️  数据库可能已存在或创建失败${NC}"
    echo "如果遇到问题，请手动创建："
    echo "  psql -U postgres"
    echo "  CREATE DATABASE ieclub_dev;"
fi

echo ""
echo "================================"
echo -e "${GREEN}✨ 本地开发环境设置完成！${NC}"
echo ""
echo -e "${BLUE}📚 下一步操作：${NC}"
echo ""
echo "1️⃣  将之前生成的所有代码文件复制到对应目录："
echo "   - src/server.js"
echo "   - src/app.js"
echo "   - src/config/database.js"
echo "   - src/models/*.js"
echo "   - src/controllers/*.js"
echo "   - src/routes/*.js"
echo "   - src/middleware/*.js"
echo "   - src/services/*.js"
echo "   - src/utils/*.js"
echo ""
echo "2️⃣  启动开发服务器："
echo "   npm run dev"
echo ""
echo "3️⃣  测试API接口："
echo "   curl http://localhost:5000/health"
echo ""
echo "4️⃣  查看日志："
echo "   tail -f logs/combined.log"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "   - 数据库密码已设置为: $DB_PASS"
echo "   - 开发环境会自动同步数据库模型"
echo "   - 文件上传保存在 ./uploads 目录"
echo "   - OCR功能使用mock数据（不需要配置）"
echo ""
echo "================================"
echo ""

# ========== 创建快速测试脚本 ==========
cat > test-api.sh << 'EOF'
#!/bin/bash

# 快速测试API脚本

echo "🧪 测试 IEclub API"
echo "=================="
echo ""

# 测试健康检查
echo "1. 测试健康检查..."
curl -s http://localhost:5000/health | jq '.' || curl -s http://localhost:5000/health
echo ""
echo ""

# 测试注册
echo "2. 测试用户注册..."
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123",
    "username": "测试用户",
    "studentId": "12012345"
  }' | jq '.' || curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123",
    "username": "测试用户",
    "studentId": "12012345"
  }'
echo ""
echo ""

# 测试登录
echo "3. 测试用户登录..."
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123"
  }' | jq '.' || curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sustech.edu.cn",
    "password": "password123"
  }'
echo ""
echo ""

echo "✅ 测试完成！"
echo "如果看到成功的响应，说明API正常工作"
EOF

chmod +x test-api.sh

echo -e "${GREEN}✅ 测试脚本已创建: ./test-api.sh${NC}"
echo ""

# ========== 创建启动脚本 ==========
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 启动 IEclub 开发服务器..."
echo ""

# 检查数据库
echo "检查 PostgreSQL 连接..."
PGPASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2) psql -U postgres -h localhost -d ieclub_dev -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

echo ""
echo "启动服务器..."
npm run dev
EOF

chmod +x start-dev.sh

echo -e "${GREEN}✅ 启动脚本已创建: ./start-dev.sh${NC}"
echo ""

# ========== 创建README ==========
cat > README.md << 'EOF'
# IEclub Backend - 本地开发

## 快速开始

### 1. 启动开发服务器
```bash
./start-dev.sh
# 或
npm run dev
```

### 2. 测试API
```bash
./test-api.sh
```

### 3. 查看日志
```bash
tail -f logs/combined.log
```

## 环境说明

- **Node.js**: 18+
- **PostgreSQL**: 13+
- **端口**: 5000

## 项目结构

```
ieclub-backend/
├── src/
│   ├── server.js          # 服务器入口
│   ├── app.js             # Express配置
│   ├── config/            # 配置文件
│   ├── models/            # 数据模型
│   ├── controllers/       # 控制器
│   ├── routes/            # 路由
│   ├── middleware/        # 中间件
│   ├── services/          # 业务逻辑
│   └── utils/             # 工具函数
├── logs/                  # 日志文件
├── uploads/               # 上传文件
└── .env                   # 环境变量
```

## API接口

- 健康检查: `GET /health`
- 用户注册: `POST /api/v1/auth/register`
- 用户登录: `POST /api/v1/auth/login`
- 获取用户: `GET /api/v1/auth/me`

详细文档请查看各个路由文件。

## 开发说明

### 本地开发特性

1. **文件上传**: 保存在 `./uploads` 目录
2. **OCR识别**: 返回mock数据（不需要配置百度OCR）
3. **邮件发送**: 跳过（不需要配置SMTP）
4. **限流**: 不启用（方便测试）
5. **数据库**: 自动同步模型（alter模式）

### 生产环境部署

等开发完成后，按照以下步骤部署：

1. 购买域名和服务器
2. 配置生产环境变量
3. 配置Nginx反向代理
4. 使用PM2管理进程
5. 申请SSL证书

详细部署指南请查看 `ecosystem.config.js` 文件注释。

## 常见问题

### 数据库连接失败

检查PostgreSQL是否运行：
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### 端口被占用

修改 `.env` 文件中的 `PORT` 值

### 依赖安装失败

清除缓存重新安装：
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 帮助

如有问题，请检查：
1. 环境变量配置 (`.env`)
2. 数据库连接
3. 日志文件 (`logs/error.log`)
EOF

echo -e "${GREEN}✅ README.md 创建完成${NC}"
echo ""

echo "🎉 所有设置完成！现在可以开始开发了！"
echo ""