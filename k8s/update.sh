#!/bin/bash
# =============================================================================
# L.A.D. Kubernetes Update Script
# Simple script to pull latest images and restart pods
# =============================================================================

set -e

# =============================================================================
# CONFIGURATION - Edit these values to match your setup
# =============================================================================

# Docker Hub username/organization
DOCKERHUB_USER="sapetor"

# Kubernetes namespace
NAMESPACE="lad"

# Image names (on Docker Hub)
FRONTEND_IMAGE="${DOCKERHUB_USER}/lad-frontend"
BACKEND_IMAGE="${DOCKERHUB_USER}/lad-backend"
ROS_IMAGE="${DOCKERHUB_USER}/lad-ros"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# =============================================================================
# FUNCTIONS
# =============================================================================

log() {
    echo -e "${GREEN}[LAD]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Pull latest images and restart deployments
update_all() {
    log "Updating all L.A.D. components..."

    # Restart deployments (this triggers image pull with imagePullPolicy: Always)
    log "Restarting frontend..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-frontend

    log "Restarting backend..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-backend

    log "Restarting ROS..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-ros

    # Wait for rollouts to complete
    log "Waiting for rollouts to complete..."
    kubectl -n $NAMESPACE rollout status deployment/lad-frontend --timeout=120s
    kubectl -n $NAMESPACE rollout status deployment/lad-backend --timeout=180s
    kubectl -n $NAMESPACE rollout status deployment/lad-ros --timeout=300s

    log "All components updated successfully!"
}

update_frontend() {
    log "Updating frontend only..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-frontend
    kubectl -n $NAMESPACE rollout status deployment/lad-frontend --timeout=120s
    log "Frontend updated!"
}

update_backend() {
    log "Updating backend only..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-backend
    kubectl -n $NAMESPACE rollout status deployment/lad-backend --timeout=180s
    log "Backend updated!"
}

update_ros() {
    log "Updating ROS only..."
    kubectl -n $NAMESPACE rollout restart deployment/lad-ros
    kubectl -n $NAMESPACE rollout status deployment/lad-ros --timeout=300s
    log "ROS updated!"
}

show_status() {
    log "Current deployment status:"
    echo ""
    kubectl -n $NAMESPACE get pods -o wide
    echo ""
    kubectl -n $NAMESPACE get services
}

show_logs() {
    local component="${1:-backend}"
    log "Showing logs for ${component}..."
    kubectl -n $NAMESPACE logs -f deployment/lad-${component} --tail=100
}

# Initial setup - apply all manifests
setup() {
    log "Setting up L.A.D. Kubernetes deployment..."

    # Apply in order
    kubectl apply -f namespace.yaml
    kubectl apply -f configmap.yaml
    kubectl apply -f secrets.yaml
    kubectl apply -f pvc.yaml
    kubectl apply -f deployment-frontend.yaml
    kubectl apply -f deployment-backend.yaml
    kubectl apply -f deployment-ros.yaml
    kubectl apply -f service-frontend.yaml
    kubectl apply -f service-backend.yaml
    kubectl apply -f service-ros.yaml
    kubectl apply -f ingress.yaml

    log "Setup complete! Waiting for pods to start..."
    sleep 5
    show_status
}

# =============================================================================
# MAIN
# =============================================================================

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  update          Update all components (pull & restart)"
    echo "  update-frontend Update frontend only"
    echo "  update-backend  Update backend only"
    echo "  update-ros      Update ROS only"
    echo "  status          Show current pod/service status"
    echo "  logs [component] Show logs (frontend/backend/ros)"
    echo "  setup           Initial setup (apply all manifests)"
    echo ""
    echo "Example workflow after pushing to GitHub:"
    echo "  1. GitHub Actions builds and pushes to Docker Hub"
    echo "  2. SSH to server"
    echo "  3. Run: ./k8s/update.sh update"
    echo ""
}

case "${1:-}" in
    update)
        update_all
        ;;
    update-frontend)
        update_frontend
        ;;
    update-backend)
        update_backend
        ;;
    update-ros)
        update_ros
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-backend}"
        ;;
    setup)
        cd "$(dirname "$0")"
        setup
        ;;
    *)
        show_usage
        ;;
esac
