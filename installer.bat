@echo off
REM ========================================
REM L.A.D Platform Installer - Windows
REM ========================================
echo.
echo ====================================
echo L.A.D Platform Installer
echo ====================================
echo.

REM Check Python installation
echo [1/7] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo.

REM Check Node.js installation
echo [2/7] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM Check Docker installation
echo [3/7] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker is not installed or not running
    echo Docker is required for ROS 2 simulation environment
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo.
    echo You can continue installation, but ROS features will not work until Docker is installed
    pause
) else (
    docker --version
)
echo.

REM Install Django backend dependencies
echo [4/7] Installing Django backend dependencies...
cd LAD\lad
if not exist ..\.venv (
    echo Creating Python virtual environment...
    python -m venv ..\.venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Verify venv activation script exists
if not exist ..\.venv\Scripts\activate.bat (
    echo ERROR: Virtual environment activation script not found
    echo Expected location: LAD\.venv\Scripts\activate.bat
    echo Attempting to recreate virtual environment...
    rmdir /s /q ..\.venv 2>nul
    python -m venv ..\.venv
    if not exist ..\.venv\Scripts\activate.bat (
        echo ERROR: Failed to create virtual environment properly
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call ..\.venv\Scripts\activate.bat
echo Installing Python packages (Django, Channels/Daphne, paramiko for QCar SSH, etc.)...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
cd ..\..
echo.

REM Run Django migrations and load fixtures
echo [5/7] Setting up Django database...
cd LAD\lad
call ..\.venv\Scripts\activate.bat
echo Running database migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Failed to run database migrations
    pause
    exit /b 1
)
echo Loading curriculum data (units, levels, objectives)...
python manage.py load_curriculum --clear
if errorlevel 1 (
    echo WARNING: Failed to load curriculum data
    echo You can load it manually later with: python manage.py load_curriculum
)
echo.
echo Creating admin superuser (you can skip this if you already have one)...
python manage.py createsuperuser
cd ..\..
echo.

REM Install React frontend dependencies
echo [6/7] Installing React frontend dependencies...
cd AVEDU\avedu
echo Installing npm packages (this may take a few minutes)...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install npm dependencies
    pause
    exit /b 1
)
cd ..\..
echo.

REM Build Docker images
echo [7/7] Building ROS 2 Docker environment...
docker --version >nul 2>&1
if errorlevel 1 (
    echo Skipping Docker build (Docker not available)
) else (
    cd qcar_docker
    echo Building Docker images (this may take 10-20 minutes on first run)...
    docker compose build
    if errorlevel 1 (
        echo WARNING: Failed to build Docker images
        echo You can try running 'docker compose build' manually later
    ) else (
        echo Docker images built successfully
    )
    cd ..
)
echo.

REM Installation complete
echo ====================================
echo Installation Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Start all services with: scripts\start-all.bat
echo 2. Or start services individually:
echo    - Backend: cd LAD\lad ^&^& ..\.venv\Scripts\activate ^&^& python manage.py runserver 0.0.0.0:8000
echo    - Frontend: cd AVEDU\avedu ^&^& npm start
echo    - ROS Docker: cd qcar_docker ^&^& docker compose up
echo.
echo 3. Access the application at: http://localhost:3000
echo 4. Access Django admin at: http://localhost:8000/admin
echo.
echo For LAN access from other devices, use the start-all script which
echo automatically detects and configures your network IP.
echo.
pause
