REM ==================== create-gitkeep.bat ====================
REM 创建.gitkeep占位文件 - 双击运行此文件
@echo off
chcp 65001 >nul

echo.
echo ========================================
echo 📁 创建目录占位文件
echo ========================================
echo.

REM 创建目录（如果不存在）
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "tests" mkdir tests

REM 创建.gitkeep文件
type nul > logs\.gitkeep
type nul > uploads\.gitkeep
type nul > tests\.gitkeep

echo ✅ logs\.gitkeep
echo ✅ uploads\.gitkeep
echo ✅ tests\.gitkeep
echo.
echo ========================================
echo ✅ 占位文件创建完成！
echo ========================================
echo.
echo 📋 说明：
echo   .gitkeep 是空文件，用于让Git追踪空目录
echo   这样即使目录是空的，也会被提交到Git仓库
echo.
pause