
REM ==================== clean-project.bat ====================
REM 清理项目 - 双击运行此文件
@echo off
chcp 65001 >nul

echo.
echo ========================================
echo 🧹 清理项目
echo ========================================
echo.
echo 将删除：
echo   - node_modules（依赖包）
echo   - package-lock.json（锁定文件）
echo   - logs\*.log（日志文件）
echo   - uploads\*（上传的文件，保留.gitkeep）
echo.

set /p CONFIRM="确定要清理吗? (y/N): "

if /i "%CONFIRM%"=="y" (
    echo.
    echo 正在清理...
    
    if exist "node_modules" (
        echo 删除 node_modules...
        rmdir /s /q node_modules
    )
    
    if exist "package-lock.json" (
        echo 删除 package-lock.json...
        del /q package-lock.json
    )
    
    if exist "logs" (
        echo 清理日志文件...
        del /q logs\*.log 2>nul
    )
    
    if exist "uploads" (
        echo 清理上传文件...
        for /d %%d in (uploads\*) do rmdir /s /q "%%d" 2>nul
        del /q uploads\*.* 2>nul
        type nul > uploads\.gitkeep
    )
    
    echo.
    echo ✅ 清理完成！
    echo.
    echo 下一步：运行 npm install 重新安装依赖
) else (
    echo 操作已取消
)
echo.
pause