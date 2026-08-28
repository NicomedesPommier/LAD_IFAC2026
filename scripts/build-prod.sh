#!/bin/bash
# scripts/build-prod.sh - Build the React frontend for the tunnel / reverse-proxy
# front door (Caddy or k8s ingress).
#
# Why this exists: the production build MUST be made with REACT_APP_SAME_ORIGIN=1
# so the app routes the terminal (/ws), API (/api) and rosbridge (/rosbridge)
# through the single front door instead of hardcoded ports (:8000, :9090). A plain
# `npm run build` bakes in the direct ports, which works on localhost but breaks
# the terminal WebSocket and the simulator over the tunnel. This wrapper bakes the
# flag in and then verifies the bundle actually came out same-origin.
#
# Usage (from anywhere):  ./scripts/build-prod.sh
# Then serve AVEDU/avedu/build/ behind Caddy (deploy/Caddyfile) — see deploy/TUNNEL.md.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."
ROOT_DIR="$(pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$ROOT_DIR/AVEDU/avedu"

echo -e "${GREEN}[1/2]${NC} Building frontend in same-origin mode (REACT_APP_SAME_ORIGIN=1)..."
# CI=false so CRA's pre-existing dependency warnings don't fail the build.
REACT_APP_SAME_ORIGIN=1 CI=false npm run build

echo -e "${GREEN}[2/2]${NC} Verifying the bundle is same-origin (no hardcoded :8000 terminal port)..."
MAIN_JS="$(ls -1 build/static/js/main.*.js 2>/dev/null | head -n1)"
if [ -z "$MAIN_JS" ]; then
  echo -e "${RED}✗ Build produced no main bundle — build failed.${NC}"
  exit 1
fi
# In same-origin mode the direct-port terminal branch is dead-code-eliminated, so
# ':8000' must be absent. If it's present, the front door routing will be wrong.
if grep -q ':8000' "$MAIN_JS"; then
  echo -e "${RED}✗ Regression: '$MAIN_JS' still references :8000.${NC}"
  echo -e "${RED}  REACT_APP_SAME_ORIGIN did not take effect — the terminal would hit the wrong port over the tunnel.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Same-origin build OK${NC} ($MAIN_JS)"
echo -e "${YELLOW}Next:${NC} serve AVEDU/avedu/build/ behind the front door (deploy/Caddyfile) — see deploy/TUNNEL.md."
