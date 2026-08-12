@echo off
title Tactical Mound Defense - Game Launcher
chcp 65001 > nul

:: [P2 4차 수정] 스크립트가 있는 현재 디렉터리로 명시적 이동
cd /d "%~dp0"

echo =======================================================
echo   Tactical Mound Defense 게임 실행기
echo =======================================================
echo.
echo 로컬 웹 서버를 시작하는 중입니다... (http://localhost:8000)
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Local_Server" /min python -m http.server 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Local_Server" /min py -m http.server 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

where npx >nul 2>nul
if %errorlevel% equ 0 (
    start "TMD_Local_Server" /min npx -y http-server -p 8000
    timeout /t 2 >nul
    start "" http://localhost:8000
    goto end
)

echo [경고] Python 및 Node.js가 설치되어 있지 않습니다.
echo VS Code Live Server나 타 웹서버를 이용하여 http://localhost:8000 환경으로 구동해주세요.
pause

:end
