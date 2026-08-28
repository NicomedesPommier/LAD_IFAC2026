#!/bin/bash
# =============================================================================
# L.A.D. Deployment Script
# Deploy to Kubernetes cluster via SSH
# =============================================================================

set -e

# =============================================================================
# CONFIGURATION - Edit these values
# =============================================================================
# Exporta estas variables antes de ejecutar (no las escribas aquí: el repo
# es público).  Ej:  GITLAB_SERVER=10.0.0.5 GITLAB_USER=deploy ./deploy-to-server.sh
GITLAB_SERVER="${GITLAB_SERVER:?Define GITLAB_SERVER (IP/host del servidor de despliegue)}"
GITLAB_USER="${GITLAB_USER:?Define GITLAB_USER (usuario SSH)}"
PROJECT_DIR="${PROJECT_DIR:-/opt/lad}"

# Container registry settings
REGISTRY="registry.gitlab.com"
REGISTRY_GROUP="YOUR_GROUP"
IMAGE_TAG="${CI_COMMIT_SHORT_SHA:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for required tools
    for cmd in docker ssh scp; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed."
            exit 1
        fi
    done

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${GITLAB_USER}@${GITLAB_SERVER}" exit 2>/dev/null; then
        log_error "Cannot connect to ${GITLAB_SERVER}. Please check SSH configuration."
        log_info "You may need to run: ssh-copy-id ${GITLAB_USER}@${GITLAB_SERVER}"
        exit 1
    fi

    log_info "All prerequisites met!"
}

# =============================================================================
# BUILD FUNCTIONS
# =============================================================================

build_frontend() {
    log_info "Building frontend Docker image..."
    docker build -t "${REGISTRY}/${REGISTRY_GROUP}/lad-frontend:${IMAGE_TAG}" \
        -t "${REGISTRY}/${REGISTRY_GROUP}/lad-frontend:latest" \
        -f AVEDU/Dockerfile \
        AVEDU/
}

build_backend() {
    log_info "Building backend Docker image..."
    docker build -t "${REGISTRY}/${REGISTRY_GROUP}/lad-backend:${IMAGE_TAG}" \
        -t "${REGISTRY}/${REGISTRY_GROUP}/lad-backend:latest" \
        -f LAD/Dockerfile \
        LAD/
}

build_ros() {
    log_info "Building ROS Docker image..."
    docker build -t "${REGISTRY}/${REGISTRY_GROUP}/lad-ros:${IMAGE_TAG}" \
        -t "${REGISTRY}/${REGISTRY_GROUP}/lad-ros:latest" \
        -f qcar_docker/Dockerfile \
        qcar_docker/
}

build_all() {
    build_frontend
    build_backend
    build_ros
}

# =============================================================================
# PUSH FUNCTIONS
# =============================================================================

push_images() {
    log_info "Pushing images to registry..."

    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-frontend:${IMAGE_TAG}"
    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-frontend:latest"

    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-backend:${IMAGE_TAG}"
    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-backend:latest"

    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-ros:${IMAGE_TAG}"
    docker push "${REGISTRY}/${REGISTRY_GROUP}/lad-ros:latest"

    log_info "All images pushed successfully!"
}

# =============================================================================
# DEPLOY FUNCTIONS
# =============================================================================

deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes cluster..."

    # Copy k8s manifests to server
    log_info "Copying Kubernetes manifests to server..."
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" "mkdir -p ${PROJECT_DIR}/k8s"
    scp -r k8s/* "${GITLAB_USER}@${GITLAB_SERVER}:${PROJECT_DIR}/k8s/"

    # Apply manifests
    log_info "Applying Kubernetes manifests..."
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" << 'ENDSSH'
        cd ${PROJECT_DIR}/k8s

        # Create namespace first
        kubectl apply -f namespace.yaml

        # Apply secrets (should already exist with real values)
        kubectl apply -f secrets.yaml

        # Apply ConfigMaps
        kubectl apply -f configmap.yaml

        # Apply PVCs
        kubectl apply -f pvc.yaml

        # Apply deployments
        kubectl apply -f deployment-frontend.yaml
        kubectl apply -f deployment-backend.yaml
        kubectl apply -f deployment-ros.yaml

        # Apply services
        kubectl apply -f service-frontend.yaml
        kubectl apply -f service-backend.yaml
        kubectl apply -f service-ros.yaml

        # Apply ingress
        kubectl apply -f ingress.yaml

        echo "Waiting for deployments to be ready..."
        kubectl -n lad rollout status deployment/lad-frontend --timeout=120s
        kubectl -n lad rollout status deployment/lad-backend --timeout=180s
        kubectl -n lad rollout status deployment/lad-ros --timeout=300s
ENDSSH

    log_info "Deployment complete!"
}

deploy_with_docker_compose() {
    log_info "Deploying with Docker Compose (alternative method)..."

    # Copy files to server
    log_info "Copying project files to server..."
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" "mkdir -p ${PROJECT_DIR}"
    scp docker-compose.server.yml "${GITLAB_USER}@${GITLAB_SERVER}:${PROJECT_DIR}/docker-compose.yml"
    scp -r config "${GITLAB_USER}@${GITLAB_SERVER}:${PROJECT_DIR}/"

    # Deploy with docker compose
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" << ENDSSH
        cd ${PROJECT_DIR}

        # Pull latest images
        docker compose pull

        # Start services
        docker compose up -d

        # Wait for services to be healthy
        sleep 10

        # Health check
        curl -f http://localhost:8000/api/health/ || echo "Backend health check failed"
        curl -f http://localhost:3000/ || echo "Frontend health check failed"
ENDSSH

    log_info "Docker Compose deployment complete!"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

show_status() {
    log_info "Getting deployment status..."
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" << 'ENDSSH'
        echo "=== Kubernetes Pods ==="
        kubectl -n lad get pods -o wide

        echo ""
        echo "=== Kubernetes Services ==="
        kubectl -n lad get services

        echo ""
        echo "=== Kubernetes Ingress ==="
        kubectl -n lad get ingress
ENDSSH
}

show_logs() {
    local component="${1:-backend}"
    log_info "Getting logs for ${component}..."
    ssh "${GITLAB_USER}@${GITLAB_SERVER}" "kubectl -n lad logs -f deployment/lad-${component} --tail=100"
}

# =============================================================================
# MAIN
# =============================================================================

show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build-all       Build all Docker images"
    echo "  build-frontend  Build frontend image only"
    echo "  build-backend   Build backend image only"
    echo "  build-ros       Build ROS image only"
    echo "  push            Push all images to registry"
    echo "  deploy          Deploy to Kubernetes cluster"
    echo "  deploy-compose  Deploy with Docker Compose"
    echo "  status          Show deployment status"
    echo "  logs [component] Show logs (frontend/backend/ros)"
    echo "  full            Build, push, and deploy"
    echo ""
}

case "${1:-}" in
    build-all)
        build_all
        ;;
    build-frontend)
        build_frontend
        ;;
    build-backend)
        build_backend
        ;;
    build-ros)
        build_ros
        ;;
    push)
        push_images
        ;;
    deploy)
        check_prerequisites
        deploy_to_kubernetes
        ;;
    deploy-compose)
        check_prerequisites
        deploy_with_docker_compose
        ;;
    status)
        check_prerequisites
        show_status
        ;;
    logs)
        check_prerequisites
        show_logs "${2:-backend}"
        ;;
    full)
        check_prerequisites
        build_all
        push_images
        deploy_to_kubernetes
        show_status
        ;;
    *)
        show_usage
        ;;
esac
