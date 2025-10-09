REM ==================== start-dev.bat ====================
REM 启动开发服务器 - 双击运行此文件
@echo off
chcp 65001 >nul
color 0A

echo.
echo ========================================
echo 🚀 启动 IEclub 开发服务器
echo ========================================
echo.

REM 检查 node_modules
if not exist "node_modules" (
    color 0E
    echo ⚠️  未找到 node_modules 目录
    echo.
    echo 正在安装依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo.
)

REM 检查 .env 文件
if not exist ".env" (
    color 0E
    echo ⚠️  未找到 .env 文件
    echo.
    if exist ".env.example" (
        echo 正在复制 .env.example 到 .env...
        copy .env.example .env >nul
        echo ✅ .env 文件已创建
        echo.
        echo ⚠️  请编辑 .env 文件，配置数据库密码！
        echo 按任意键继续...
        pause >nul
    ) else (
        echo ❌ 也未找到 .env.example
        echo 请手动创建 .env 文件
        pause
        exit /b 1
    )
)

REM 检查数据库连接
echo 正在检查数据库连接...
for /f "tokens=2 delims==" %%i in ('findstr "DB_PASSWORD" .env') do set DB_PASS=%%i
for /f "tokens=2 delims==" %%i in ('findstr "DB_NAME" .env') do set DB_NAME=%%i

set PGPASSWORD=%DB_PASS%
psql -U postgres -h localhost -d %DB_NAME% -c "SELECT 1;" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ 数据库连接正常
) else (
    color 0E
    echo ⚠️  数据库连接失败
    echo.
    echo 可能的原因：
    echo   1. PostgreSQL 未启动
    echo   2. 数据库 %DB_NAME% 不存在
    echo   3. .env 中的密码不正确
    echo.
    set /p CREATE_DB="是否尝试创建数据库? (y/N): "
    if /i "%CREATE_DB%"=="y" (
        psql -U postgres -h localhost -c "CREATE DATABASE %DB_NAME%;" 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo ✅ 数据库创建成功
        ) else (
            echo ❌ 数据库创建失败，请手动创建
        )
    )
)

echo.
echo ========================================
echo 🚀 正在启动服务器...
echo ========================================
echo.
echo 💡 提示：
echo   - 服务器地址: http://localhost:5000
echo   - 健康检查: http://localhost:5000/health
echo   - 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

REM 启动开发服务器
npm run dev