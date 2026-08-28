#!/bin/bash
# scripts/start-all.sh - Start all L.A.D services with auto-detected IP

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Go to the parent directory (L.A.D root)
cd "$SCRIPT_DIR/.."
ROOT_DIR="$(pwd)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   L.A.D Platform - Starting Services  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"
echo -e "Working directory: ${ROOT_DIR}\n"

# Detect IP using Node.js
echo -e "${GREEN}[1/6]${NC} Detecting local IP address..."
cd "$ROOT_DIR/AVEDU/avedu"
IP=$(node scripts/detect-ip.js 2>&1 | grep "Detected local IP:" | awk '{print $NF}')
cd "$ROOT_DIR"

if [ -z "$IP" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-detect IP, using config file${NC}"
    IP=$(cat config/ip_config.json | grep exposed_ip | cut -d'"' -f4)
fi

echo -e "${GREEN}✓${NC} Using IP: ${BLUE}$IP${NC}\n"

# Update React .env.local with detected IP
echo -e "${GREEN}[2/6]${NC} Updating React environment variables..."
cd "$ROOT_DIR/AVEDU/avedu"
cat > .env.local <<EOF
# .env.local - Local development overrides (gitignored)
# This file is automatically managed by the start script

# Bind to all network interfaces to allow LAN connections
HOST=0.0.0.0

# Allow connections from any host (required for LAN access)
DANGEROUSLY_DISABLE_HOST_CHECK=true

# API base - uses proxy during development
REACT_APP_API_BASE=/api

# Detected network IP for ROS/Static connections
REACT_APP_HOST=$IP
EOF
cd "$ROOT_DIR"
echo -e "${GREEN}✓${NC} React .env.local updated with IP: ${BLUE}$IP${NC}\n"

# Update Docker environment variables
echo -e "${GREEN}[3/6]${NC} Updating Docker environment variables..."
cd "$ROOT_DIR/qcar_docker"
cat > .env <<EOF
# Docker Compose environment variables
# This file is automatically managed by the start script

# Exposed IP for CORS configuration
EXPOSED_IP=$IP
EOF
cd "$ROOT_DIR"
echo -e "${GREEN}✓${NC} Docker .env updated for IP: ${BLUE}$IP${NC}\n"

# Start ROS Docker
echo -e "${GREEN}[4/6]${NC} Starting ROS 2 Docker (rosbridge + QCar + Gazebo)..."
cd "$ROOT_DIR/qcar_docker"
# Temporary workaround so the Python backend can access the docker socket without needing a system reboot
sudo chmod 666 /var/run/docker.sock || true
docker compose up -d
cd "$ROOT_DIR"
echo -e "${GREEN}✓${NC} ROS services running on:"
echo -e "   - rosbridge: ws://$IP:9090"
echo -e "   - static server: http://$IP:7000"
echo -e "${YELLOW}⏳${NC} Gazebo initialization takes 60-90 seconds...\n"

# Start Django Backend (ASGI via Daphne for WebSocket terminal support)
echo -e "${GREEN}[5/6]${NC} Starting Django backend (ASGI/Daphne)..."
cd "$ROOT_DIR/LAD/lad"
if [ ! -f "../.venv/bin/python" ] && [ ! -f "../.venv/Scripts/python.exe" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found, creating...${NC}"
    python3 -m venv ../.venv
    ../.venv/bin/pip install -r requirements.txt 2>&1 | grep -E "Successfully|Requirement already"
fi

# Resolve venv python path (bin/ on Linux/Mac, Scripts/ on Windows/Git Bash)
if [ -f "../.venv/bin/python" ]; then
    VENV_PYTHON="../.venv/bin/python"
else
    VENV_PYTHON="../.venv/Scripts/python"
fi

# Run migrations if needed
$VENV_PYTHON manage.py migrate --no-input 2>&1 | grep -E "Applying|No migrations"

# Start Django in background (Daphne ASGI server — required for WebSocket PTY terminal)
$VENV_PYTHON manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
echo $DJANGO_PID > /tmp/lad_django.pid
cd "$ROOT_DIR"
echo -e "${GREEN}✓${NC} Django ASGI running on: http://$IP:8000"
echo -e "   REST API:          http://$IP:8000/api/"
echo -e "   WebSocket terminal: ws://$IP:8000/ws/terminal/{canvas_id}/\n"

# Start React Frontend
echo -e "${GREEN}[6/6]${NC} Starting React frontend..."
cd "$ROOT_DIR/AVEDU/avedu"
npm start &
REACT_PID=$!
echo $REACT_PID > /tmp/lad_react.pid
cd "$ROOT_DIR"

echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}   All services started successfully!   ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}🌐 Access your application:${NC}"
echo -e "   Local:   ${GREEN}http://localhost:3000${NC}"
echo -e "   Network: ${GREEN}http://$IP:3000${NC}\n"

echo -e "${BLUE}🔌 ROS endpoints:${NC}"
echo -e "   rosbridge:          ${GREEN}ws://$IP:9090${NC}"
echo -e "   Static server:      ${GREEN}http://$IP:7000${NC}"
echo -e "   Django API:         ${GREEN}http://$IP:8000${NC}"
echo -e "   Terminal WebSocket: ${GREEN}ws://$IP:8000/ws/terminal/{id}/${NC}\n"

echo -e "${YELLOW}⏳ Wait 60-90 seconds for Gazebo to initialize${NC}\n"

echo -e "${YELLOW}ℹ️  To stop all services, run:${NC}"
echo -e "   $ROOT_DIR/scripts/stop-all.sh\n"

echo -e "${YELLOW}ℹ️  To view logs:${NC}"
echo -e "   Django:  tail -f $ROOT_DIR/LAD/lad/django.log"
echo -e "   React:   Check terminal output"
echo -e "   Docker:  docker compose -f $ROOT_DIR/qcar_docker/docker-compose.yml logs -f\n"

# Keep script running (optional)
# wait
