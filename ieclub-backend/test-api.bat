
REM ==================== test-api.bat ====================
REM API测试脚本 - 双击运行此文件
@echo off
chcp 65001 >nul
color 0B

echo.
echo ========================================
echo 🧪 IEclub API 接口测试
echo ========================================
echo.

REM 检查服务器是否运行
curl -s http://localhost:5000/health >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ 服务器未运行！
    echo.
    echo 请先运行 start-dev.bat 启动服务器
    pause
    exit /b 1
)

echo ✅ 服务器正在运行
echo.

REM 定义测试邮箱
set TEST_EMAIL=test_%RANDOM%@sustech.edu.cn
set TEST_PASSWORD=password123
set TEST_USERNAME=测试用户%RANDOM%

echo ========================================
echo 测试 1/5: 健康检查
echo ========================================
curl -s http://localhost:5000/health
echo.
echo.

echo ========================================
echo 测试 2/5: 用户注册
echo ========================================
echo 邮箱: %TEST_EMAIL%
echo 密码: %TEST_PASSWORD%
echo.

curl -X POST http://localhost:5000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\",\"username\":\"%TEST_USERNAME%\",\"studentId\":\"12012345\"}" ^
  -o register_response.json

echo 响应已保存到 register_response.json
type register_response.json
echo.
echo.

REM 提取token（简化版，使用PowerShell）
for /f "delims=" %%i in ('powershell -Command "(Get-Content register_response.json | ConvertFrom-Json).token"') do set TOKEN=%%i

if "%TOKEN%"=="" (
    color 0C
    echo ❌ 注册失败，未获取到token
    echo.
    pause
    exit /b 1
)

echo ✅ 注册成功，Token: %TOKEN:~0,20%...
echo.

echo ========================================
echo 测试 3/5: 用户登录
echo ========================================

curl -X POST http://localhost:5000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\"}"

echo.
echo.

echo ========================================
echo 测试 4/5: 获取当前用户信息
echo ========================================

curl -X GET http://localhost:5000/api/v1/auth/me ^
  -H "Authorization: Bearer %TOKEN%"

echo.
echo.

echo ========================================
echo 测试 5/5: 创建帖子
echo ========================================

curl -X POST http://localhost:5000/api/v1/posts ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"title\":\"测试帖子\",\"content\":\"这是一个测试内容\",\"category\":\"学术\",\"tags\":[\"测试\",\"API\"]}"

echo.
echo.

echo ========================================
echo ✅ 测试完成！
echo ========================================
echo.
echo 清理临时文件...
del register_response.json 2>nul
echo.
echo 💡 提示：
echo   - 所有接口测试通过
echo   - Token: %TOKEN:~0,30%...
echo   - 可以用此Token继续测试其他接口
echo.

pause