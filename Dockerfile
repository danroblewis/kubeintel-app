# Multi-stage build for KubeIntel web application
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy frontend source
COPY . .

# Build frontend
RUN pnpm build

# Backend builder stage
FROM node:18-alpine AS backend-builder

WORKDIR /app/server

# Copy backend package files
COPY server/package.json ./
RUN npm install

# Copy backend source
COPY server/src ./src
COPY server/tsconfig.json ./

# Build backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install kubectl
RUN apk add --no-cache curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

WORKDIR /app

# Copy backend production dependencies
COPY server/package.json ./
RUN npm install --only=production

# Copy built backend
COPY --from=backend-builder /app/server/dist ./dist

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kubeintel -u 1001

# Create directory for credentials
RUN mkdir -p /home/kubeintel/.kubeintel && \
    chown -R kubeintel:nodejs /home/kubeintel

USER kubeintel

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]