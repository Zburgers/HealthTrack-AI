# services/workers/Dockerfile
# Optimized for: smaller image size, faster builds, security

FROM node:18-alpine AS builder
WORKDIR /build

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy workers package files
COPY services/workers/package.json /build/package.json
COPY services/workers/package-lock.json /build/package-lock.json
RUN cd /build && npm install --ignore-scripts

# Copy workers source files
COPY services/workers/tsconfig.json /build/
COPY services/workers/src/ /build/src/

# Build workers
RUN cd /build && npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 workers

# Copy dependencies and built application with ownership
COPY --chown=workers:nodejs --from=builder /build/node_modules ./node_modules
COPY --chown=workers:nodejs --from=builder /build/dist ./dist

EXPOSE 8080

# Use non-root user
USER workers

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

CMD ["node", "dist/index.js"]
