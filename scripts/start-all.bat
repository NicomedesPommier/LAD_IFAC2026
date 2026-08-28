@echo off
REM scripts\start-all.bat - Start all L.A.D services (Windows)

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
REM Go to the parent directory (L.A.D root)
cd /d "%SCRIPT_DIR%.."

echo ========================================
echo    L.A.D Platform - Starting Services
echo ========================================
echo.
echo Working directory: %CD%
echo.

REM Detect IP using Node.js
echo [1/6] Detecting local IP address...
cd /d "%CD%\AVEDU\avedu"
for /f "tokens=*" %%i in ('node scripts\detect-ip.js 2^>^&1 ^| findstr /C:"Detected local IP:"') do (
    for %%a in (%%i) do set IP=%%a
)
cd /d "%SCRIPT_DIR%.."

if "%IP%"=="" (
    echo Warning: Could not auto-detect IP, reading from config
    for /f "tokens=2 delims=:," %%a in ('type config\ip_config.json ^| findstr exposed_ip') do (
        set IP=%%a
        set IP=!IP:"=!
        set IP=!IP: =!
    )
)

echo [OK] Using IP: %IP%
echo.

REM Update React .env.local with detected IP
echo [2/6] Updating React environment variables...
cd /d "%SCRIPT_DIR%..\AVEDU\avedu"
(
echo # .env.local - Local development overrides ^(gitignored^)
echo # This file is automatically managed by the start script
echo.
echo # Bind to all network interfaces to allow LAN connections
echo HOST=0.0.0.0
echo.
echo # Allow connections from any host ^(required for LAN access^)
echo DANGEROUSLY_DISABLE_HOST_CHECK=true
echo.
echo # API base - uses proxy during development
echo REACT_APP_API_BASE=/api
echo.
echo # Detected network IP for ROS/Static connections
echo REACT_APP_HOST=%IP%
) > .env.local
cd /d "%SCRIPT_DIR%.."
echo [OK] React .env.local updated with IP: %IP%
echo.

REM Update Docker environment variables
echo [3/6] Updating Docker environment variables...
cd /d "%SCRIPT_DIR%..\qcar_docker"
(
echo # Docker Compose environment variables
echo # This file is automatically managed by the start script
echo.
echo # Exposed IP for CORS configuration
echo EXPOSED_IP=%IP%
) > .env
cd /d "%SCRIPT_DIR%.."
echo [OK] Docker .env updated for IP: %IP%
echo.

REM Start ROS Docker
echo [4/6] Starting ROS 2 Docker...
cd /d "%SCRIPT_DIR%..\qcar_docker"
docker compose up -d
cd /d "%SCRIPT_DIR%.."
echo [OK] ROS services running on:
echo    - rosbridge: ws://%IP%:9090
echo    - static server: http://%IP%:7000
echo.
echo [INFO] Gazebo initialization takes 60-90 seconds...
echo.

REM Start Django Backend
echo [5/6] Starting Django backend...
cd /d "%SCRIPT_DIR%..\LAD\lad"
if not exist "..\.venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv ..\.venv
)
..\.venv\Scripts\pip install -r requirements.txt -q

..\.venv\Scripts\python manage.py migrate --no-input
start "Django Backend" cmd /k "..\.venv\Scripts\python manage.py runserver 0.0.0.0:8000"
cd /d "%SCRIPT_DIR%.."
echo [OK] Django API running on: http://%IP%:8000
echo.

REM Start React Frontend
echo [6/6] Starting React frontend...
cd /d "%SCRIPT_DIR%..\AVEDU\avedu"
start "React Frontend" cmd /k npm start
cd /d "%SCRIPT_DIR%.."
echo.

echo ========================================
echo    All services started successfully!
echo ========================================
echo.
echo Access your application:
echo    Local:   http://localhost:3000
echo    Network: http://%IP%:3000
echo.
echo ROS endpoints:
echo    rosbridge: ws://%IP%:9090
echo    Static server: http://%IP%:7000
echo    Django API: http://%IP%:8000
echo.
echo [!] Wait 60-90 seconds for Gazebo to initialize
echo.
echo To stop services, close the terminal windows
echo or run: scripts\stop-all.bat
echo.

pause
