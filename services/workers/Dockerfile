# services/workers/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy shared package first
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npm install

# Copy workers package
COPY services/workers/package.json services/workers/package-lock.json* ./services/workers/
RUN cd services/workers && npm ci --ignore-scripts

COPY services/workers/tsconfig.json services/workers/src/ ./services/workers/
RUN cd services/workers && npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/services/workers/node_modules ./node_modules
COPY --from=builder /app/services/workers/dist ./dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

CMD ["node", "dist/index.js"]
