#!/usr/bin/env bash
set -e 
source /opt/ros/humble/setup.bash
source /ros2_ws/install/setup.bash

# ===== Config =====
: "${STATIC_PORT:=7000}"
: "${WVS_PORT:=8080}"
: "${USER_DEFINED_CORS_FLAG:=${CORS_ALLOW_ORIGIN+x}}"
: "${CORS_ALLOW_ORIGIN:=http://localhost:8000}"
: "${ENABLE_ROSAPI:=1}"
: "${ENABLE_JSP:=1}"
: "${ENABLE_WVS:=0}"
: "${ENABLE_TURTLESIM:=0}"
: "${ENABLE_GAZEBO:=0}"
: "${GAZEBO_WORLD:=}"
: "${ENABLE_DUMMY_CAMERAS:=0}"
: "${ENABLE_UNITY_TCP:=0}"
: "${UNITY_TCP_PORT:=10000}"
# Set BROWSER_SIM=1 to use launch_browser_sim.py (no Gazebo, minimal stack).
# When 0 (default), the full web_viz.launch.py is used (Gazebo optional via flag).
: "${BROWSER_SIM:=0}"
# Args opcionales para xacro (ej: "use_camera:=true")
: "${XACRO_ARGS:=}"

# Extract EXPOSED_IP from config file (always, for use in URDF generation)
CONFIG_PATH="${IP_CONFIG_PATH:-}"
echo "[entrypoint] CONFIG_PATH=${CONFIG_PATH}"
if [ -n "${CONFIG_PATH}" ] && [ -r "${CONFIG_PATH}" ]; then
  echo "[entrypoint] Reading IP from ${CONFIG_PATH}"
  EXPOSED_IP="$(python3 - "${CONFIG_PATH}" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
except (OSError, json.JSONDecodeError):
    sys.exit(0)

ip = (data.get("exposed_ip") or "").strip()
if ip:
    print(ip)
PY
)"
  echo "[entrypoint] EXPOSED_IP=${EXPOSED_IP}"
else
  echo "[entrypoint] Config file not found or not readable"
fi

# Update CORS_ALLOW_ORIGIN if not user-defined
# Always include localhost, 127.0.0.1, and detected IP for comprehensive CORS support
if [ "${USER_DEFINED_CORS_FLAG}" != "x" ]; then
  if [ -n "${EXPOSED_IP}" ]; then
    CORS_ALLOW_ORIGIN="http://localhost:3000,http://127.0.0.1:3000,http://${EXPOSED_IP}:3000"
  else
    CORS_ALLOW_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"
  fi
fi

# ===== Rutas desde qcar_description instalado =====
QCAR_DESC_PREFIX="$(ros2 pkg prefix qcar_description)"
QCAR_DESC_SHARE="${QCAR_DESC_PREFIX}/share/qcar_description"
URDF_DIR="${QCAR_DESC_SHARE}/urdf"
MAIN_XACRO="${URDF_DIR}/qcar_ros2.urdf.xacro"
TMP_URDF="/tmp/robot_model/robot.urdf"

echo "[entrypoint] qcar_description: ${QCAR_DESC_SHARE}"
echo "[entrypoint] XACRO: ${MAIN_XACRO}"
[ -f "${MAIN_XACRO}" ] || { echo "[ERROR] No existe ${MAIN_XACRO}"; exit 1; }

mkdir -p /tmp/robot_model

# Generate base URDF from xacro
xacro "${MAIN_XACRO}" ${XACRO_ARGS} > "${TMP_URDF}"
grep -q "<robot" "${TMP_URDF}" || { echo "[ERROR] URDF inválido"; exit 1; }

# Determine the base URL for mesh resources
# If we have an exposed IP, use it; otherwise fall back to localhost
MESH_BASE_URL="http://localhost:${STATIC_PORT}/qcar_description/"
if [ -n "${EXPOSED_IP}" ]; then
  MESH_BASE_URL="http://${EXPOSED_IP}:${STATIC_PORT}/qcar_description/"
fi

# Create web-specific URDF with relative paths for browser visualization
# The URDF is served at: http://IP:PORT/qcar_description/urdf/robot_runtime.urdf
# Meshes are served at: http://IP:PORT/qcar_description/meshes/
# So we use relative path: ../meshes/ (go up from urdf/ to qcar_description/, then into meshes/)
WEB_URDF="${URDF_DIR}/robot_runtime.urdf"
cp "${TMP_URDF}" "${WEB_URDF}"
# Replace both package:// URIs and file:// absolute paths with relative paths
sed -i "s|package://qcar_description/meshes/|../meshes/|g" "${WEB_URDF}"
sed -i "s|file://${QCAR_DESC_SHARE}/meshes/|../meshes/|g" "${WEB_URDF}"
echo "[entrypoint] Created web URDF with relative mesh paths (../meshes/)"
echo "[entrypoint] Web URDF: ${MESH_BASE_URL}urdf/robot_runtime.urdf"

# Create Gazebo-specific URDF with file:// URIs
GAZEBO_URDF="${URDF_DIR}/robot_gazebo.urdf"
cp "${TMP_URDF}" "${GAZEBO_URDF}"
sed -i "s|package://qcar_description/|file://${QCAR_DESC_SHARE}/|g" "${GAZEBO_URDF}"
echo "[entrypoint] Created Gazebo URDF with file:// mesh URLs"

# Also keep the tmp version with package:// URIs for robot_state_publisher
# robot_state_publisher can resolve package:// URIs correctly
echo "[entrypoint] Keeping package:// URIs in ${TMP_URDF} for robot_state_publisher"

# Configure Gazebo with GPU acceleration
if [ "${ENABLE_GAZEBO}" = "1" ]; then
  echo "[entrypoint] Configuring Gazebo with GPU acceleration..."

  # Check if DISPLAY is already set (from host X11 forwarding)
  if [ -z "${DISPLAY}" ]; then
    # No DISPLAY set, use Xvfb for headless operation
    echo "[entrypoint] Starting Xvfb (for OpenGL context, GPU handles rendering)..."
    Xvfb :99 -screen 0 1024x768x24 +extension GLX +render -noreset &
    export DISPLAY=:99
    sleep 2
    echo "[entrypoint] Using virtual display :99 (headless mode)"
  else
    # DISPLAY is set from host, use it for GUI
    echo "[entrypoint] Using host DISPLAY=${DISPLAY} for Gazebo GUI"
    # Allow X11 connections (needed for Docker)
    xhost +local:docker 2>/dev/null || echo "[entrypoint] xhost not available (running in container)"
  fi

  # Set Gazebo model path so it can find meshes
  export GAZEBO_MODEL_PATH="${QCAR_DESC_SHARE}:${GAZEBO_MODEL_PATH}"
  echo "[entrypoint] GAZEBO_MODEL_PATH: ${GAZEBO_MODEL_PATH}"

  # Disable model database to speed up initialization
  export GAZEBO_MODEL_DATABASE_URI=""
  echo "[entrypoint] Disabled Gazebo model database for faster startup"

  echo "[entrypoint] Using NVIDIA GPU for rendering ($(nvidia-smi --query-gpu=name --format=csv,noheader || echo 'GPU detection failed'))"
fi

# Start ROS-TCP-Endpoint for Unity if enabled
if [ "${ENABLE_UNITY_TCP}" = "1" ]; then
  echo "[entrypoint] Starting ROS-TCP-Endpoint for Unity on port ${UNITY_TCP_PORT}..."
  ros2 run ros_tcp_endpoint default_server_endpoint --ros-args \
    -p ROS_IP:=0.0.0.0 \
    -p ROS_TCP_PORT:=${UNITY_TCP_PORT} &
  echo "[entrypoint] ROS-TCP-Endpoint started in background"
fi

# Build launch arguments
LAUNCH_ARGS=(
  "cors_allow_origin:=${CORS_ALLOW_ORIGIN}"
  "static_port:=${STATIC_PORT}"
  "enable_rosapi:=$([ "${ENABLE_ROSAPI}" = "1" ] && echo true || echo false)"
  "enable_jsp:=$([ "${ENABLE_JSP}" = "1" ] && echo true || echo false)"
  "enable_gazebo:=$([ "${ENABLE_GAZEBO}" = "1" ] && echo true || echo false)"
)

# Only add gazebo_world if it has a value
if [ -n "${GAZEBO_WORLD}" ]; then
  LAUNCH_ARGS+=("gazebo_world:=${GAZEBO_WORLD}")
fi

# Add remaining flags
LAUNCH_ARGS+=(
  "enable_wvs:=$([ "${ENABLE_WVS}" = "1" ] && echo true || echo false)"
  "wvs_port:=${WVS_PORT}"
  "enable_turtlesim:=$([ "${ENABLE_TURTLESIM}" = "1" ] && echo true || echo false)"
  "enable_dummy_cameras:=$([ "${ENABLE_DUMMY_CAMERAS}" = "1" ] && echo true || echo false)"
)

# Launch: browser-sim mode uses a minimal stack (no Gazebo nodes at all).
# Full mode uses web_viz.launch.py where Gazebo is conditional via ENABLE_GAZEBO.
if [ "${BROWSER_SIM}" = "1" ]; then
  echo "[entrypoint] BROWSER_SIM=1 → launch_browser_sim.py (no Gazebo)"
  exec ros2 launch qcar_bringup launch_browser_sim.py \
    "enable_rosapi:=$([ "${ENABLE_ROSAPI}" = "1" ] && echo true || echo false)" \
    "enable_jsp:=$([ "${ENABLE_JSP}" = "1" ] && echo true || echo false)"
else
  exec ros2 launch qcar_bringup web_viz.launch.py "${LAUNCH_ARGS[@]}"
fi
