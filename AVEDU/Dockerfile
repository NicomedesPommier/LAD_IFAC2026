# =============================================================================
# L.A.D. Frontend - Multi-stage Dockerfile
# React application with ROS integration
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files for dependency caching
COPY avedu/package*.json ./

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Install all dependencies (including dev for build)
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
FROM deps AS builder

# Copy source code
COPY avedu/ ./

# Build arguments for configuration
# Defaults are for local development (direct port access)
# For Kubernetes, pass: --build-arg PUBLIC_URL=/lad --build-arg REACT_APP_API_BASE=/lad/api
ARG REACT_APP_API_BASE=/api
ARG REACT_APP_HOST=localhost
ARG PUBLIC_URL=/

ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV REACT_APP_HOST=$REACT_APP_HOST
ENV PUBLIC_URL=$PUBLIC_URL

# Build the production bundle
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: Production
# -----------------------------------------------------------------------------
FROM node:18-alpine AS production

# Install dumb-init and serve
RUN apk add --no-cache dumb-init \
    && npm install -g serve

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/build ./build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Serve the static files
CMD ["serve", "-s", "build", "-l", "3000"]
