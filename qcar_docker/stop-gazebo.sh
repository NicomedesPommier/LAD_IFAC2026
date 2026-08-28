#!/bin/bash
# Script to stop the QCar Gazebo simulation

echo "Stopping QCar Gazebo simulation..."
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose down
echo "Simulation stopped."
