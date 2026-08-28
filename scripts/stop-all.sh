#!/bin/bash
# scripts/stop-all.sh - Stop all L.A.D services

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Go to the parent directory (L.A.D root)
cd "$SCRIPT_DIR/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   L.A.D Platform - Stopping Services  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Stop React
if [ -f /tmp/lad_react.pid ]; then
    echo -e "${RED}[1/3]${NC} Stopping React frontend..."
    kill $(cat /tmp/lad_react.pid) 2>/dev/null || echo "React already stopped"
    rm /tmp/lad_react.pid
    echo -e "${GREEN}✓${NC} React stopped\n"
else
    echo -e "${GREEN}[1/3]${NC} React not running\n"
fi

# Stop Django
if [ -f /tmp/lad_django.pid ]; then
    echo -e "${RED}[2/3]${NC} Stopping Django backend..."
    kill $(cat /tmp/lad_django.pid) 2>/dev/null || echo "Django already stopped"
    rm /tmp/lad_django.pid
    echo -e "${GREEN}✓${NC} Django stopped\n"
else
    echo -e "${GREEN}[2/3]${NC} Django not running\n"
fi

# Stop Docker
echo -e "${RED}[3/3]${NC} Stopping ROS Docker..."
cd qcar_docker
docker compose down
cd ..
echo -e "${GREEN}✓${NC} Docker stopped\n"

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}   All services stopped successfully!   ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"
