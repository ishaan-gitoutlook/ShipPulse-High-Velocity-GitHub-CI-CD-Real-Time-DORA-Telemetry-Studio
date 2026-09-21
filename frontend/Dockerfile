# ==============================================================================
# ShipPulse - Multi-Stage Production Dockerfile (Angular 21 SSR)
# ==============================================================================

# Stage 1: Build Application
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Server Runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=3000

# Copy built application and SSR server bundle from builder with unprivileged ownership
COPY --from=builder --chown=node:node /app/dist/app ./dist/app
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Run container as unprivileged 'node' user (CIS Benchmark & NIST SP 800-190)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/app/server/server.mjs"]
