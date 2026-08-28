@echo off
REM start-frontend.bat - Quick start for React frontend only

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ========================================
echo    L.A.D Frontend - Quick Start
echo ========================================
echo.

echo Detecting IP and starting development server...
echo.

REM Just run npm start - it will handle IP detection via prestart
npm start

pause
