@echo off
REM ==================== Windows 本地开发环境快速启动脚本 ====================
REM 使用方法：双击运行 local-setup.bat

chcp 65001 >nul
color 0A

echo.
echo ========================================
echo 🚀 IEclub 本地开发环境设置 (Windows)
echo ========================================
echo.

REM ========== 检查Node.js ==========
echo 📋 步骤 1/6: 检查开发环境
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ Node.js 未安装
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js 已安装: %NODE_VERSION%
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ npm 未安装
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✅ npm 已安装: %NPM_VERSION%
)

where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo ⚠️  PostgreSQL 未安装或未添加到PATH
    echo 请安装 PostgreSQL: https://www.postgresql.org/download/windows/
    pause
) else (
    for /f "tokens=3" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo ✅ PostgreSQL 已安装: %PSQL_VERSION%
)

echo.

REM ========== 创建目录结构 ==========
echo 📁 步骤 2/6: 创建项目目录结构
echo.

if not exist "src" mkdir src
if not exist "src\config" mkdir src\config
if not exist "src\middleware" mkdir src\middleware
if not exist "src\models" mkdir src\models
if not exist "src\controllers" mkdir src\controllers
if not exist "src\routes" mkdir src\routes
if not exist "src\services" mkdir src\services
if not exist "src\utils" mkdir src\utils
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "tests" mkdir tests

echo ✅ 目录结构创建完成
echo.

REM ========== 创建package.json ==========
echo 📦 步骤 3/6: 创建 package.json
echo.

if not exist "package.json" (
    (
        echo {
        echo   "name": "ieclub-backend",
        echo   "version": "1.0.0",
        echo   "description": "IE Club 学生交流论坛后端API",
        echo   "main": "src/server.js",
        echo   "scripts": {
        echo     "start": "node src/server.js",
        echo     "dev": "nodemon src/server.js",
        echo     "test": "jest --coverage"
        echo   },
        echo   "keywords": ["forum", "student", "education"],
        echo   "author": "Your Name",
        echo   "license": "MIT"
        echo }
    ) > package.json
    echo ✅ package.json 创建完成
) else (
    echo ⚠️  package.json 已存在，跳过
)

echo.

REM ========== 安装依赖 ==========
echo 📥 步骤 4/6: 安装项目依赖
echo 这可能需要几分钟...
echo.

if exist "node_modules" (
    echo ⚠️  node_modules 已存在
    set /p REINSTALL="是否重新安装依赖? (y/N): "
    if /i "%REINSTALL%"=="y" (
        rmdir /s /q node_modules
        del /q package-lock.json 2>nul
        call npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet express-rate-limit express-validator morgan compression axios nodemailer winston multer ali-oss ioredis
        call npm install -D nodemon jest supertest eslint sequelize-cli
        echo ✅ 依赖安装完成
    ) else (
        echo 跳过依赖安装
    )
) else (
    call npm install express pg sequelize bcryptjs jsonwebtoken dotenv cors helmet express-rate-limit express-validator morgan compression axios nodemailer winston multer ali-oss ioredis
    call npm install -D nodemon jest supertest eslint sequelize-cli
    echo ✅ 依赖安装完成
)

echo.

REM ========== 创建.env文件 ==========
echo ⚙️  步骤 5/6: 配置环境变量
echo.

if not exist ".env" (
    (
        echo # ==================== 本地开发环境配置 ====================
        echo.
        echo # 服务器配置
        echo NODE_ENV=development
        echo PORT=5000
        echo API_VERSION=v1
        echo.
        echo # 数据库配置 ^(本地PostgreSQL^)
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=ieclub_dev
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo DB_POOL_MAX=20
        echo DB_POOL_MIN=2
        echo.
        echo # JWT配置 ^(开发用^)
        echo JWT_SECRET=dev_secret_key_for_local_development_only_12345
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # CORS配置 ^(允许本地前端^)
        echo CORS_ORIGIN=http://localhost:3000,http://localhost:5173
        echo.
        echo # 邮箱配置 ^(开发环境可留空^)
        echo SMTP_HOST=
        echo SMTP_PORT=
        echo SMTP_USER=
        echo SMTP_PASSWORD=
        echo EMAIL_FROM=noreply@ieclub.com
        echo.
        echo # 允许的邮箱域名
        echo ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,gmail.com
        echo.
        echo # 文件上传配置 ^(本地存储^)
        echo UPLOAD_DIR=./uploads
        echo MAX_FILE_SIZE=10485760
        echo ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
        echo.
        echo # 阿里云OSS配置 ^(开发环境留空^)
        echo ALI_OSS_REGION=
        echo ALI_OSS_ACCESS_KEY_ID=
        echo ALI_OSS_ACCESS_KEY_SECRET=
        echo ALI_OSS_BUCKET=
        echo.
        echo # OCR配置 ^(开发环境留空^)
        echo BAIDU_OCR_APP_ID=
        echo BAIDU_OCR_API_KEY=
        echo BAIDU_OCR_SECRET_KEY=
        echo.
        echo # 日志配置
        echo LOG_LEVEL=debug
        echo LOG_FILE_PATH=./logs
        echo.
        echo # 限流配置
        echo RATE_LIMIT_WINDOW=15
        echo RATE_LIMIT_MAX=1000
        echo.
        echo # 前端URL ^(本地^)
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo ✅ .env 文件创建完成
    echo 💡 请根据实际情况修改 DB_PASSWORD
) else (
    echo ⚠️  .env 文件已存在，跳过
)

REM 创建.gitignore
if not exist ".gitignore" (
    (
        echo # Dependencies
        echo node_modules/
        echo package-lock.json
        echo.
        echo # Environment variables
        echo .env
        echo .env.local
        echo.
        echo # Logs
        echo logs/
        echo *.log
        echo.
        echo # Testing
        echo coverage/
        echo.
        echo # IDE
        echo .vscode/
        echo .idea/
        echo.
        echo # OS
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Uploads
        echo uploads/*
        echo !uploads/.gitkeep
    ) > .gitignore
    type nul > uploads\.gitkeep
    echo ✅ .gitignore 创建完成
)

echo.

REM ========== 配置数据库 ==========
echo 🗄️  步骤 6/6: 配置数据库
echo.

set /p DB_PASS="请输入 PostgreSQL 密码 (默认: postgres): "
if "%DB_PASS%"=="" set DB_PASS=postgres

REM 更新.env文件中的密码
powershell -Command "(gc .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%DB_PASS%' | Out-File -encoding ASCII .env"

echo 创建开发数据库...
set PGPASSWORD=%DB_PASS%
psql -U postgres -h localhost -c "CREATE DATABASE ieclub_dev;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ 数据库 ieclub_dev 创建成功
) else (
    echo ⚠️  数据库可能已存在或创建失败
    echo 如果遇到问题，请手动创建：
    echo   psql -U postgres
    echo   CREATE DATABASE ieclub_dev;
)

echo.
echo ========================================
echo ✨ 本地开发环境设置完成！
echo ========================================
echo.
echo 📚 下一步操作：
echo.
echo 1️⃣  将生成的代码文件复制到对应目录
echo 2️⃣  启动开发服务器: npm run dev
echo 3️⃣  测试API: curl http://localhost:5000/health
echo.
echo 💡 提示：
echo   - 数据库密码: %DB_PASS%
echo   - 文件保存在 uploads 目录
echo   - OCR使用mock数据
echo.
echo ========================================
echo.

REM ========== 创建启动脚本 ==========
(
    echo @echo off
    echo chcp 65001 ^>nul
    echo echo 🚀 启动 IEclub 开发服务器...
    echo echo.
    echo npm run dev
) > start-dev.bat

echo ✅ 启动脚本已创建: start-dev.bat
echo.

REM ========== 创建测试脚本 ==========
(
    echo @echo off
    echo chcp 65001 ^>nul
    echo echo 🧪 测试 IEclub API
    echo echo ==================
    echo echo.
    echo echo 1. 测试健康检查...
    echo curl -s http://localhost:5000/health
    echo echo.
    echo echo 2. 测试用户注册...
    echo curl -X POST http://localhost:5000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@sustech.edu.cn\",\"password\":\"password123\",\"username\":\"测试用户\",\"studentId\":\"12012345\"}"
    echo echo.
    echo echo 3. 测试用户登录...
    echo curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@sustech.edu.cn\",\"password\":\"password123\"}"
    echo echo.
    echo pause
) > test-api.bat

echo ✅ 测试脚本已创建: test-api.bat
echo.

echo 🎉 所有设置完成！
echo.
echo 现在可以：
echo   - 双击 start-dev.bat 启动服务器
echo   - 双击 test-api.bat 测试API
echo.
pause
