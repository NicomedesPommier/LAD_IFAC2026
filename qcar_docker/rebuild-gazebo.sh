#!/bin/bash
# Rebuild Docker container with Gazebo integration

echo "================================"
echo "Rebuilding QCar Docker with Gazebo"
echo "================================"
echo ""

echo "[1/3] Stopping existing containers..."
docker compose down

echo ""
echo "[2/3] Rebuilding Docker image..."
docker compose build --no-cache

echo ""
echo "[3/3] Starting containers with Gazebo enabled..."
docker compose up -d

echo ""
echo "================================"
echo "Build Complete!"
echo "================================"
echo ""
echo "Gazebo simulation is now running."
echo ""
echo "Check logs with: docker compose logs -f ros"
echo ""
echo "ROS topics available at: ws://localhost:9090"
echo "Static files at: http://localhost:7000"
echo ""
echo "Press Ctrl+C to stop viewing logs"
sleep 3

docker compose logs -f ros
