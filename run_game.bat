@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo   Tactical Mound Defense - Game Launcher
echo =======================================================
echo.
echo Starting local web server at http://localhost:8000 ...
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Server" /min python -m http.server 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Server" /min py -m http.server 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

where npx >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Server" /min npx -y http-server -p 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

echo [ERROR] Neither Python nor Node.js was found on system PATH.
echo Please run a local web server (e.g. VS Code Live Server) on port 8000.
pause

:end
