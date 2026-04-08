# Workers service - placeholder
# Will be populated in Phase 3 (Workers Service)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production || true
COPY . .
RUN npm run build || true
CMD ["node", "dist/index.js"]
