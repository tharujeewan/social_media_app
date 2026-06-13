# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Prisma client generation ────────────────────────────────────────
FROM node:20-alpine AS prisma

WORKDIR /app

# Need full deps (including prisma CLI) to generate the client
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/

# Generate Prisma client into node_modules
RUN npx prisma generate

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy production node_modules from deps stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy generated Prisma client (overwrites the stub in node_modules)
COPY --from=prisma --chown=appuser:appgroup /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma --chown=appuser:appgroup /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy application source
COPY --chown=appuser:appgroup . .

# Expose the application port
EXPOSE 3000

# Health check — polls the /api/health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Use dumb-init as PID 1 to handle signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
