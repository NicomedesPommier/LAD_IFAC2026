#!/bin/bash
# Quick start script for QCar LIDAR wall detection simulation
# Usage: ./start_lidar_sim.sh

set -e

echo "================================================"
echo "🚗 QCar LIDAR Wall Detection Simulation"
echo "================================================"
echo ""

# Check if Docker container is running
if ! docker ps | grep -q "qcar_docker-ros"; then
    echo "❌ Docker container not running!"
    echo "   Start with: cd qcar_docker && docker-compose up -d"
    exit 1
fi

echo "✅ Docker container is running"
echo ""

# Source ROS2 environment and launch
echo "🚀 Launching simulation..."
echo "   - Gazebo with walls world"
echo "   - QCar with LIDAR sensor"
echo "   - rosbridge on port 9090"
echo "   - TF2 web republisher"
echo ""

docker exec -it qcar_docker-ros-1 bash -c "
    source /opt/ros/humble/setup.bash && \
    source /qcar/rosws/install/setup.bash && \
    ros2 launch qcar_bringup lidar_wall_test.launch.py
"

# Note: This script will keep running until you press Ctrl+C
# The simulation will stop when you exit
