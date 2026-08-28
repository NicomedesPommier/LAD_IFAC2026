#!/bin/bash
# ========================================
# L.A.D Platform Installer - Linux/Mac
# ========================================

set -e  # Exit on error

echo ""
echo "===================================="
echo "L.A.D Platform Installer"
echo "===================================="
echo ""

# Check Python installation
echo "[1/7] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.10+ from your package manager or https://www.python.org/downloads/"
    exit 1
fi
python3 --version
echo ""

# Check Node.js installation
echo "[2/7] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/ or your package manager"
    exit 1
fi
node --version
echo ""

# Check Docker installation
echo "[3/7] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "WARNING: Docker is not installed or not running"
    echo "Docker is required for ROS 2 simulation environment"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    echo ""
    echo "You can continue installation, but ROS features will not work until Docker is installed"
    read -p "Press Enter to continue..."
else
    docker --version
fi
echo ""

# Install Django backend dependencies
echo "[4/7] Installing Django backend dependencies..."
cd LAD/lad
if [ ! -d "../.venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv ../.venv
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to create virtual environment"
        echo ""
        echo "This is likely because the 'python3-venv' package is not installed."
        echo "Please install it with one of these commands:"
        echo ""
        echo "  Ubuntu/Debian:  sudo apt-get install python3-venv"
        echo "  Fedora/RHEL:    sudo dnf install python3-virtualenv"
        echo "  Arch Linux:     sudo pacman -S python-virtualenv"
        echo ""
        echo "Then run this installer again."
        echo ""
        exit 1
    fi
fi

# Verify venv activation script exists
if [ ! -f "../.venv/bin/activate" ]; then
    echo "ERROR: Virtual environment activation script not found"
    echo "Attempting to recreate virtual environment..."
    rm -rf ../.venv
    python3 -m venv ../.venv
    if [ ! -f "../.venv/bin/activate" ]; then
        echo "ERROR: Failed to create virtual environment properly"
        exit 1
    fi
fi

echo "Activating virtual environment..."
source ../.venv/bin/activate
echo "Installing Python packages (Django, Channels/Daphne, paramiko for QCar SSH, etc.)..."
pip install -r requirements.txt
cd ../..
echo ""

# Run Django migrations and load fixtures
echo "[5/7] Setting up Django database..."
cd LAD/lad
source ../.venv/bin/activate
echo "Running database migrations..."
python manage.py migrate
echo "Loading curriculum data (units, levels, objectives)..."
python manage.py load_curriculum --clear || {
    echo "WARNING: Failed to load curriculum data"
    echo "You can load it manually later with: python manage.py load_curriculum"
}
echo ""
echo "Creating admin superuser (you can skip this if you already have one)..."
python manage.py createsuperuser || true
cd ../..
echo ""

# Install React frontend dependencies
echo "[6/7] Installing React frontend dependencies..."
cd AVEDU/avedu
echo "Installing npm packages (this may take a few minutes)..."
npm install
cd ../..
echo ""

# Build Docker images
echo "[7/7] Building ROS 2 Docker environment..."
if command -v docker &> /dev/null; then
    cd qcar_docker
    echo "Building Docker images (this may take 10-20 minutes on first run)..."
    docker compose build || {
        echo "WARNING: Failed to build Docker images"
        echo "You can try running 'docker compose build' manually later"
    }
    cd ..
else
    echo "Skipping Docker build (Docker not available)"
fi
echo ""

# Installation complete
echo "===================================="
echo "Installation Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Start all services with: ./scripts/start-all.sh"
echo "2. Or start services individually:"
echo "   - ROS Docker:  cd qcar_docker && docker compose up -d"
echo "   - Backend:     cd LAD/lad && source ../.venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
echo "   - Frontend:    cd AVEDU/avedu && npm start"
echo ""
echo "3. Access the application at: http://localhost:3000"
echo "4. Access Django admin at:    http://localhost:8000/admin"
echo ""
echo "Notes:"
echo "  - The backend runs via Daphne (ASGI) to support WebSocket terminal PTY."
echo "    You should see 'Starting ASGI/Daphne...' when the server starts."
echo "  - The IDE terminal connects directly to ws://HOST:8000/ws/terminal/..."
echo "    (not through the React proxy) — make sure port 8000 is reachable."
echo "  - For LAN access use the start-all script which auto-detects your network IP."
echo "  - On Bazzite OS: use ./installer-bazzite.sh instead (Podman / immutable filesystem)."
echo ""
