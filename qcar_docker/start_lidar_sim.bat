@echo off
REM Quick start script for QCar LIDAR wall detection simulation (Windows)
REM Usage: start_lidar_sim.bat

echo ================================================
echo 🚗 QCar LIDAR Wall Detection Simulation
echo ================================================
echo.

REM Check if Docker container is running
docker ps | findstr "qcar_docker-ros" >nul
if errorlevel 1 (
    echo ❌ Docker container not running!
    echo    Start with: cd qcar_docker ^&^& docker-compose up -d
    exit /b 1
)

echo ✅ Docker container is running
echo.

REM Source ROS2 environment and launch
echo 🚀 Launching simulation...
echo    - Gazebo with walls world
echo    - QCar with LIDAR sensor
echo    - rosbridge on port 9090
echo    - TF2 web republisher
echo.

docker exec -it qcar_docker-ros-1 bash -c "source /opt/ros/humble/setup.bash && source /qcar/rosws/install/setup.bash && ros2 launch qcar_bringup lidar_wall_test.launch.py"

REM Note: This script will keep running until you press Ctrl+C
REM The simulation will stop when you exit
