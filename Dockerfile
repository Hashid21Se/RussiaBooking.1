# ==============================================================================
# Multi-stage Production Dockerfile for RussiaBooking Platform
# Engine: Node.js 20 LTS Alpine (Optimized for security, performance & minimal size)
# ==============================================================================

# Stage 1: Dependency & Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies required for native compilation if any
RUN apk add --no-cache libc6-compat python3 make g++

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

# Copy entire source tree
COPY . .

# Run test verification during build phase
ENV NODE_ENV=production
RUN npm run build

# Prune devDependencies to keep image lean
RUN npm prune --production

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Create non-privileged service user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application and node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./index.html

# Set ownership to unprivileged user
RUN chown -R appuser:nodejs /app

USER appuser

# Expose standard container port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the optimized production server
CMD ["node", "dist/server.cjs"]
