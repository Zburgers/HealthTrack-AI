# Production Dockerfile for NestJS Backend
# Optimized for: smaller image size, faster builds, security

# ============================================================
# Stage 1: Dependencies (production only)
# ============================================================
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
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
COPY --from=deps /app/node_modules ./node_modules
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

# Copy production dependencies and built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Set proper permissions
RUN chown -R nestjs:nodejs /app

# Use non-root user
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
