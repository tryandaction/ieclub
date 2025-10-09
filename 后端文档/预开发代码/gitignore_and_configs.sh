# ==================== .gitignore ====================
# 依赖目录
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# 环境变量文件
.env
.env.local
.env.*.local
.env.production
.env.development
.env.test

# 日志文件
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pids
*.pid
*.seed
*.pid.lock

# 测试覆盖率
coverage/
.nyc_output
*.lcov

# 编辑器和IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
*.sublime-project
*.sublime-workspace

# 操作系统文件
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# 构建输出
dist/
build/
out/
.next/

# 临时文件
tmp/
temp/
*.tmp
.cache/

# 上传的文件（可选，看是否需要版本控制）
uploads/*
!uploads/.gitkeep

# PM2
.pm2/
ecosystem.config.js.bak

# 数据库文件（如果使用SQLite）
*.sqlite
*.sqlite3
*.db

# 备份文件
*.bak
*.backup
*.old

# 其他
.env.backup
dump.rdb
*.pem
*.key
!mock-cert.pem


# ==================== .env.example ====================
# 这是环境变量模板文件，复制为 .env 并修改配置

# ========== 服务器配置 ==========
NODE_ENV=development
PORT=5000
API_VERSION=v1

# ========== 数据库配置 ==========
# 本地开发使用
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ieclub_dev
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_POOL_MAX=20
DB_POOL_MIN=2

# ========== JWT配置 ==========
# 生产环境必须修改为强密钥！
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

# ========== CORS配置 ==========
# 开发环境
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
# 生产环境示例: https://www.ieclub.com,https://ieclub.com

# ========== 邮箱配置 ==========
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ieclub.com
SMTP_PASSWORD=your_email_password
EMAIL_FROM=IEclub <noreply@ieclub.com>

# ========== 允许的邮箱域名 ==========
# 开发环境可以放宽
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,gmail.com
# 生产环境: sustech.edu.cn,mail.sustech.edu.cn

# ========== 文件上传配置 ==========
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# ========== 阿里云OSS配置（生产环境使用） ==========
ALI_OSS_REGION=oss-cn-shenzhen
ALI_OSS_ACCESS_KEY_ID=your_access_key_id
ALI_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALI_OSS_BUCKET=ieclub-files

# ========== Redis配置（可选） ==========
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ========== 百度OCR配置 ==========
OCR_PROVIDER=baidu
BAIDU_OCR_APP_ID=your_app_id
BAIDU_OCR_API_KEY=your_api_key
BAIDU_OCR_SECRET_KEY=your_secret_key

# ========== 日志配置 ==========
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# ========== 限流配置 ==========
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW=15
AUTH_RATE_LIMIT_MAX=5

# ========== 前端URL ==========
FRONTEND_URL=http://localhost:3000


# ==================== package.json（优化版） ====================
{
  "name": "ieclub-backend",
  "version": "1.0.0",
  "description": "IE Club 学生交流论坛后端API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage --detectOpenHandles",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "db:create": "sequelize-cli db:create",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:reset": "sequelize-cli db:migrate:undo:all && sequelize-cli db:migrate && sequelize-cli db:seed:all",
    "logs:error": "tail -f logs/error.log",
    "logs:combined": "tail -f logs/combined.log"
  },
  "keywords": [
    "forum",
    "student",
    "education",
    "community",
    "api",
    "express",
    "postgresql"
  ],
  "author": "IE Club Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "axios": "^1.6.2",
    "nodemailer": "^6.9.7",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "multer": "^1.4.5-lts.1",
    "ali-oss": "^6.18.1",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.56.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-plugin-import": "^2.29.1",
    "sequelize-cli": "^6.6.2"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "nodemonConfig": {
    "watch": [
      "src"
    ],
    "ext": "js,json",
    "ignore": [
      "src/**/*.test.js",
      "node_modules"
    ],
    "delay": 1000
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ],
    "testMatch": [
      "**/__tests__/**/*.js",
      "**/?(*.)+(spec|test).js"
    ]
  }
}


# ==================== .eslintrc.js（可选，代码规范） ====================
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'consistent-return': 'off',
    'func-names': 'off',
    'object-shorthand': 'off',
    'no-process-exit': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-unused-expressions': ['error', { allowTaggedTemplates: true }],
    'comma-dangle': ['error', 'never'],
    'max-len': ['error', { code: 120, ignoreComments: true }]
  }
};


# ==================== .sequelizerc（数据库迁移配置） ====================
const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src/db', 'seeds'),
  'migrations-path': path.resolve('src/db', 'migrations')
};


# ==================== uploads/.gitkeep ====================
# 这个文件用于保持uploads目录存在
# Git不会追踪空目录，所以需要这个占位文件
