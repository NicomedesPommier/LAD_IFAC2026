#!/bin/bash
# Script to launch QCar Gazebo simulation with GUI on Ubuntu

set -e

echo "========================================"
echo "  QCar Gazebo Simulation Launcher"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Allow Docker to connect to X server
echo "Configuring X11 permissions for Docker..."
xhost +local:docker

# Check if container is already running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "Container is already running. Restarting to apply configuration..."
    docker compose down
fi

echo ""
echo "Starting QCar Gazebo simulation with GUI..."
echo "This will:"
echo "  - Launch ROS 2 Humble with rosbridge"
echo "  - Start Gazebo with QCar robot model"
echo "  - Enable LIDAR simulation"
echo "  - Display Gazebo GUI on your screen"
echo ""
echo "Ports exposed:"
echo "  - 9090: rosbridge (WebSocket)"
echo "  - 7000: Static file server (URDF/meshes)"
echo "  - 8080: Web video server"
echo "  - 10000: ROS-TCP-Endpoint (Unity)"
echo "  - 11345: Gazebo master"
echo ""

# Start the container
docker compose up -d

echo ""
echo "Waiting for Gazebo server to initialize..."
sleep 10

# Launch Gazebo GUI client
echo ""
echo "Launching Gazebo GUI client..."
docker exec -d qcar_docker-ros-1 bash -c "export DISPLAY=${DISPLAY} && gzclient"

echo ""
echo "Gazebo GUI should now be visible on your screen!"
echo ""
echo "Available ROS topics:"
echo "  - /qcar/lidar/scan (LaserScan)"
echo "  - /qcar/cmd_vel (Twist - for controlling the robot)"
echo "  - /qcar/odom (Odometry)"
echo "  - /qcar/csi_front/image_raw (Camera images)"
echo "  - And more..."
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo ""
echo "Press Ctrl+C to exit (simulation will keep running)..."

# Keep the script running
tail -f /dev/null
