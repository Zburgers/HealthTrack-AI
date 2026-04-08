# Production Dockerfile for NestJS Backend
# Optimized for: smaller image size, faster builds, security

# ============================================================
# Stage 1: Dependencies (production only)
# ============================================================
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files for better cache utilization
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# ============================================================
# Stage 2: Build dependencies (all deps for compilation)
# ============================================================
FROM node:18-alpine AS builder
WORKDIR /app

# Copy all dependencies for build
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source files (respects .dockerignore)
COPY . .

# Build the application
RUN npm run build

# ============================================================
# Stage 3: Production runner (minimal footprint)
# ============================================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies with ownership set directly
COPY --chown=nestjs:nodejs --from=deps /app/node_modules ./node_modules
# Copy built application with ownership set directly
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Install curl for healthcheck (minimal package)
RUN apk add --no-cache curl

EXPOSE 3000

# Use non-root user
USER nestjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/src/main"]
