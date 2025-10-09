

REM ==================== setup-all.bat ====================
REM 一键完整设置 - 双击运行此文件
@echo off
chcp 65001 >nul
color 0A

echo.
echo ========================================
echo 🚀 IEclub 一键完整设置（Windows）
echo ========================================
echo.

REM 第1步：创建目录结构
echo [1/6] 📁 创建项目目录结构...
if not exist "src\config" mkdir src\config
if not exist "src\middleware" mkdir src\middleware
if not exist "src\models" mkdir src\models
if not exist "src\controllers" mkdir src\controllers
if not exist "src\routes" mkdir src\routes
if not exist "src\services" mkdir src\services
if not exist "src\utils" mkdir src\utils
if not exist "src\db\migrations" mkdir src\db\migrations
if not exist "src\db\seeds" mkdir src\db\seeds
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "tests" mkdir tests
echo ✅ 目录创建完成
echo.

REM 第2步：创建占位文件
echo [2/6] 📝 创建占位文件...
type nul > logs\.gitkeep
type nul > uploads\.gitkeep
type nul > tests\.gitkeep
echo ✅ 占位文件创建完成
echo.

REM 第3步：检查Node.js
echo [3/6] 🔍 检查开发环境...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ 未安装 Node.js
    echo.
    echo 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo ✅ Node.js %%i
echo.

REM 第4步：安装依赖
echo [4/6] 📦 安装项目依赖...
if exist "package.json" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装成功
) else (
    echo ⚠️  未找到 package.json，跳过
)
echo.

REM 第5步：配置环境变量
echo [5/6] ⚙️  配置环境变量...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo ✅ .env 文件已创建
        echo.
        set /p DB_PASS="请输入 PostgreSQL 密码: "
        powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%DB_PASS%' | Set-Content .env"
        echo ✅ 数据库密码已配置
    ) else (
        echo ⚠️  未找到 .env.example
    )
) else (
    echo ✅ .env 文件已存在
)
echo.

REM 第6步：创建数据库
echo [6/6] 🗄️  创建数据库...
for /f "tokens=2 delims==" %%i in ('findstr "DB_PASSWORD" .env') do set DB_PASS=%%i
for /f "tokens=2 delims==" %%i in ('findstr "DB_NAME" .env') do set DB_NAME=%%i

set PGPASSWORD=%DB_PASS%
psql -U postgres -h localhost -c "CREATE DATABASE %DB_NAME%;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ 数据库 %DB_NAME% 创建成功
) else (
    echo ⚠️  数据库可能已存在
)
echo.

echo ========================================
echo ✨ 设置完成！
echo ========================================
echo.
echo 📋 接下来的步骤：
echo.
echo   1. 复制所有代码文件到对应目录
echo   2. 双击 start-dev.bat 启动服务器
echo   3. 双击 test-api.bat 测试接口
echo.
echo 💡 提示：
echo   - 所有批处理文件都在项目根目录
echo   - 双击即可运行，无需命令行
echo.
pause