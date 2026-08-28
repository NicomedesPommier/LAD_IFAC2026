#!/usr/bin/env bash
# Script to fix URDF mesh paths for web visualization
# Run this inside the container after it starts

set -e

QCAR_DESC_PREFIX="$(ros2 pkg prefix qcar_description)"
QCAR_DESC_SHARE="${QCAR_DESC_PREFIX}/share/qcar_description"
URDF_DIR="${QCAR_DESC_SHARE}/urdf"
WEB_URDF="${URDF_DIR}/robot_runtime.urdf"

echo "[fix_urdf] Fixing mesh paths in ${WEB_URDF}"

# Replace file:// absolute paths with relative paths
sed -i "s|file://${QCAR_DESC_SHARE}/meshes/|../meshes/|g" "${WEB_URDF}"

echo "[fix_urdf] Done! Mesh paths now use relative URLs (../meshes/)"
echo "[fix_urdf] Verifying changes..."
grep "mesh filename" "${WEB_URDF}" | head -3
