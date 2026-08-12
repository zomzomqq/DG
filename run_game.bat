@echo off
title Tactical Mound Defense - Game Launcher
chcp 65001 > nul
echo =======================================================
echo   Tactical Mound Defense 게임 실행기
echo =======================================================
echo.
echo 로컬 웹 서버를 시작하는 중입니다... (http://localhost:8000)
echo.

:: Python 3 설치 여부 확인 후 서버 실행
where python >nul 2>nul
if %errorlevel% equ 0 (
    start "" http://localhost:8000
    python -m http.server 8000
    goto end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    start "" http://localhost:8000
    py -m http.server 8000
    goto end
)

:: Node.js npx fallback
where npx >nul 2>nul
if %errorlevel% equ 0 (
    start "" http://localhost:8000
    npx -y http-server -p 8000
    goto end
)

echo [경고] Python 및 Node.js가 설치되어 있지 않습니다.
echo 브라우저의 보안 정책(CORS)으로 인해 file:// 주소 직접 실행 대신
echo VS Code의 Live Server 확장 기능이나 로컬 웹서버 프로그램으로 실행해주세요.
pause

:end
