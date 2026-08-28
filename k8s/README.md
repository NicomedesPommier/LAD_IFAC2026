# L.A.D. Kubernetes Deployment

Complete guide for deploying L.A.D. (Learn Autonomous Driving) to a Kubernetes cluster.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Configure Docker Hub](#step-1-configure-docker-hub)
4. [Step 2: Configure GitHub Actions](#step-2-configure-github-actions)
5. [Step 3: Update Kubernetes Manifests](#step-3-update-kubernetes-manifests)
6. [Step 4: Copy Files to Server](#step-4-copy-files-to-server)
7. [Step 5: Deploy to Kubernetes](#step-5-deploy-to-kubernetes)
8. [Step 6: Verify Deployment](#step-6-verify-deployment)
9. [Updating the Application](#updating-the-application)
10. [Troubleshooting](#troubleshooting)
11. [Useful Commands](#useful-commands)

---

## Architecture Overview

L.A.D. consists of three components deployed as separate pods:

| Component | Description | Container Port | Docker Hub Image |
|-----------|-------------|----------------|------------------|
| **Frontend** | React web application | 3000 | `yourusername/lad-frontend` |
| **Backend** | Django REST API | 8000 | `yourusername/lad-backend` |
| **ROS** | ROS 2 Humble + Gazebo simulation | 9090, 7000, 8080 | `yourusername/lad-ros` |

**Namespace:** `lad`

---

## Prerequisites

Before starting, ensure you have:

- [ ] A Kubernetes cluster with `kubectl` access
- [ ] Docker Hub account
- [ ] GitHub repository with this code
- [ ] SSH access to the server running Kubernetes
- [ ] Nginx Ingress Controller installed on the cluster (for external access)

---

## Step 1: Configure Docker Hub

### 1.1 Create Docker Hub Account

If you don't have one, create an account at [hub.docker.com](https://hub.docker.com)

### 1.2 Create Access Token

1. Go to Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Name: `github-actions`
4. Permissions: Read & Write
5. Click "Generate" and **copy the token** (you won't see it again)

### 1.3 Note Your Username

Your Docker Hub username will be used in image names, e.g., `yourusername/lad-frontend`

---

## Step 2: Configure GitHub Actions

The repository includes a GitHub Actions workflow that automatically builds and pushes Docker images when you push to `main`.

### 2.1 Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The access token from Step 1.2 |

### 2.2 Verify Workflow

The workflow file is at `.github/workflows/docker-build.yml`. It will:
- Build `lad-frontend`, `lad-backend`, and `lad-ros` images
- Push them to Docker Hub with `latest` tag
- Trigger on every push to `main` or `master` branch

---

## Step 3: Update Kubernetes Manifests

Before deploying, you need to update the image names in the manifest files.

### 3.1 Update Deployment Files

Replace `YOUR_DOCKERHUB_USER` with your actual Docker Hub username in these files:

**k8s/deployment-frontend.yaml** (line ~43):
```yaml
image: YOUR_DOCKERHUB_USER/lad-frontend:latest
# Change to:
image: yourusername/lad-frontend:latest
```

**k8s/deployment-backend.yaml** (line ~60):
```yaml
image: YOUR_DOCKERHUB_USER/lad-backend:latest
# Change to:
image: yourusername/lad-backend:latest
```

**k8s/deployment-ros.yaml** (line ~37):
```yaml
image: YOUR_DOCKERHUB_USER/lad-ros:latest
# Change to:
image: yourusername/lad-ros:latest
```

### 3.2 Update Helper Script

Edit **k8s/update.sh** (line ~13):
```bash
DOCKERHUB_USER="YOUR_DOCKERHUB_USER"
# Change to:
DOCKERHUB_USER="yourusername"
```

### 3.3 Update Ingress Host (Optional)

If you have a domain, edit **k8s/ingress.yaml**:
```yaml
rules:
  - host: lad.example.com
  # Change to:
  - host: lad.yourdomain.com
```

### 3.4 Update Secrets (Important!)

Edit **k8s/secrets.yaml** and set a secure Django secret key:
```yaml
stringData:
  DJANGO_SECRET_KEY: "change-me-in-production-use-a-strong-random-key"
```

Generate a secure key with:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## Step 4: Copy Files to Server

### 4.1 Connect to Server

```bash
ssh root@YOUR_SERVER_IP
```

### 4.2 Create Directory

```bash
mkdir -p /opt/lad
```

### 4.3 Exit and Copy Files

```bash
exit
scp -r k8s/ root@YOUR_SERVER_IP:/opt/lad/
```

This copies the entire `k8s/` folder to `/opt/lad/k8s/` on the server.

---

## Step 5: Deploy to Kubernetes

### 5.1 SSH to Server

```bash
ssh root@YOUR_SERVER_IP
cd /opt/lad/k8s
```

### 5.2 Apply Manifests in Order

```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create ConfigMaps
kubectl apply -f configmap.yaml

# 3. Create Secrets
kubectl apply -f secrets.yaml

# 4. Create Persistent Volume Claims
kubectl apply -f pvc.yaml

# 5. Deploy applications
kubectl apply -f deployment-frontend.yaml
kubectl apply -f deployment-backend.yaml
kubectl apply -f deployment-ros.yaml

# 6. Create services
kubectl apply -f service-frontend.yaml
kubectl apply -f service-backend.yaml
kubectl apply -f service-ros.yaml

# 7. Create ingress (for external access)
kubectl apply -f ingress.yaml
```

**Or apply all at once:**
```bash
kubectl apply -f .
```

### 5.3 Wait for Pods to Start

```bash
# Watch pods come up
kubectl -n lad get pods -w

# Wait until all pods show STATUS: Running
# Press Ctrl+C to exit watch mode
```

---

## Step 6: Verify Deployment

### 6.1 Check Pod Status

```bash
kubectl -n lad get pods
```

Expected output:
```
NAME                            READY   STATUS    RESTARTS   AGE
lad-backend-xxxxx-xxxxx         1/1     Running   0          2m
lad-frontend-xxxxx-xxxxx        1/1     Running   0          2m
lad-ros-xxxxx-xxxxx             1/1     Running   0          2m
```

### 6.2 Check Services

```bash
kubectl -n lad get services
```

Expected output:
```
NAME           TYPE        CLUSTER-IP      PORT(S)
lad-backend    ClusterIP   10.x.x.x        8000/TCP
lad-frontend   ClusterIP   10.x.x.x        3000/TCP
lad-ros        ClusterIP   10.x.x.x        9090/TCP,7000/TCP,8080/TCP
```

### 6.3 Check Ingress

```bash
kubectl -n lad get ingress
```

### 6.4 Test Health Endpoint

```bash
# Port-forward to test backend directly
kubectl -n lad port-forward deployment/lad-backend 8000:8000 &

# Test health endpoint
curl http://localhost:8000/api/health/

# Expected: {"status": "healthy", "database": "connected"}
```

---

## Updating the Application

After pushing changes to GitHub:

### Option A: Using the Helper Script

```bash
ssh root@YOUR_SERVER_IP
cd /opt/lad/k8s

# Update all components
./update.sh update

# Or update specific component
./update.sh update-frontend
./update.sh update-backend
./update.sh update-ros
```

### Option B: Manual Update

```bash
ssh root@YOUR_SERVER_IP

# Restart deployments (pulls latest images)
kubectl -n lad rollout restart deployment/lad-frontend
kubectl -n lad rollout restart deployment/lad-backend
kubectl -n lad rollout restart deployment/lad-ros

# Watch the rollout
kubectl -n lad rollout status deployment/lad-frontend
kubectl -n lad rollout status deployment/lad-backend
kubectl -n lad rollout status deployment/lad-ros
```

---

## Troubleshooting

### Pod Won't Start

```bash
# Check pod events
kubectl -n lad describe pod <pod-name>

# Check logs
kubectl -n lad logs <pod-name>

# Common issues:
# - ImagePullBackOff: Wrong image name or Docker Hub credentials
# - CrashLoopBackOff: Application error, check logs
# - Pending: Not enough resources or PVC issues
```

### Image Pull Errors

```bash
# Verify image exists on Docker Hub
docker pull yourusername/lad-frontend:latest

# Check if image name is correct in deployment
kubectl -n lad get deployment lad-frontend -o yaml | grep image:
```

### Backend Database Issues

```bash
# Check backend logs
kubectl -n lad logs deployment/lad-backend

# Exec into pod to debug
kubectl -n lad exec -it deployment/lad-backend -- /bin/bash

# Inside pod:
python manage.py check
python manage.py migrate --check
```

### ROS Not Connecting

```bash
# Check ROS logs
kubectl -n lad logs deployment/lad-ros

# Verify rosbridge is running
kubectl -n lad logs deployment/lad-ros | grep -i rosbridge

# Check if port 9090 is accessible
kubectl -n lad port-forward deployment/lad-ros 9090:9090
```

### View Real-time Logs

```bash
# Frontend logs
kubectl -n lad logs -f deployment/lad-frontend

# Backend logs
kubectl -n lad logs -f deployment/lad-backend

# ROS logs
kubectl -n lad logs -f deployment/lad-ros
```

---

## Useful Commands

### Status Commands

```bash
# All resources in namespace
kubectl -n lad get all

# Pods with more details
kubectl -n lad get pods -o wide

# Describe a specific pod
kubectl -n lad describe pod <pod-name>
```

### Log Commands

```bash
# Current logs
kubectl -n lad logs deployment/lad-backend

# Follow logs (real-time)
kubectl -n lad logs -f deployment/lad-backend

# Previous container logs (after crash)
kubectl -n lad logs deployment/lad-backend --previous
```

### Restart Commands

```bash
# Restart single deployment
kubectl -n lad rollout restart deployment/lad-frontend

# Restart all deployments
kubectl -n lad rollout restart deployment --all
```

### Debug Commands

```bash
# Exec into a running pod
kubectl -n lad exec -it deployment/lad-backend -- /bin/bash

# Port-forward for local testing
kubectl -n lad port-forward deployment/lad-frontend 3000:3000
kubectl -n lad port-forward deployment/lad-backend 8000:8000
kubectl -n lad port-forward deployment/lad-ros 9090:9090
```

### Cleanup Commands

```bash
# Delete all resources in namespace (keeps namespace)
kubectl -n lad delete all --all

# Delete entire namespace and everything in it
kubectl delete namespace lad
```

---

## File Reference

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates the `lad` namespace |
| `configmap.yaml` | Environment variables and IP configuration |
| `secrets.yaml` | Django secret key (edit before deploying!) |
| `pvc.yaml` | Persistent storage for database and files |
| `deployment-frontend.yaml` | React frontend pod configuration |
| `deployment-backend.yaml` | Django backend pod configuration |
| `deployment-ros.yaml` | ROS 2 simulation pod configuration |
| `service-frontend.yaml` | Internal service for frontend |
| `service-backend.yaml` | Internal service for backend |
| `service-ros.yaml` | Internal service for ROS (with session affinity) |
| `ingress.yaml` | External HTTP routing rules |
| `update.sh` | Helper script for updates |

---

## Workflow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT WORKFLOW                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL                                                           │
│  ┌─────────────┐                                                 │
│  │ git push    │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  GITHUB ACTIONS                                                  │
│  ┌─────────────────────────────────────┐                        │
│  │ Build Docker images                 │                        │
│  │ - lad-frontend                      │                        │
│  │ - lad-backend                       │                        │
│  │ - lad-ros                           │                        │
│  └──────┬──────────────────────────────┘                        │
│         │                                                        │
│         ▼                                                        │
│  DOCKER HUB                                                      │
│  ┌─────────────────────────────────────┐                        │
│  │ Store images with :latest tag       │                        │
│  │ - yourusername/lad-frontend:latest  │                        │
│  │ - yourusername/lad-backend:latest   │                        │
│  │ - yourusername/lad-ros:latest       │                        │
│  └──────┬──────────────────────────────┘                        │
│         │                                                        │
│         ▼                                                        │
│  SERVER (via SSH)                                                │
│  ┌─────────────────────────────────────┐                        │
│  │ cd /opt/lad/k8s                     │                        │
│  │ ./update.sh update                  │                        │
│  │                                     │                        │
│  │ (Restarts pods, pulls new images)   │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
