# Production-ready Dockerfile for Next.js (Node.js 18 Alpine)
# Optimized for: smaller image size, faster builds, security

# ============================================================
# Stage 1: Dependencies (production only)
# ============================================================
FROM node:18-alpine AS deps
WORKDIR /app

# Copy only lock files for better cache utilization
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

# Accept build-time environment variables securely
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG HF_KEY

# Re-export as ENV so they are available during `next build`
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV HF_KEY=$HF_KEY
ENV NODE_ENV=production

# Skip prebuild in Docker (handles missing git, electron artifacts, etc.)
ENV SKIP_PREBUILD=true

# Copy source files (respects .dockerignore)
COPY . .

# Build with standalone output for easier deployment
RUN npm run build

# ============================================================
# Stage 3: Production runner (minimal footprint)
# ============================================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts and production dependencies with ownership
COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

# Install wget for healthcheck (smaller than curl on alpine)
RUN apk add --no-cache wget

EXPOSE 8080

# Use non-root user
USER nextjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["node", "server.js"]
