# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20 AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# ─── Stage 2: Prisma client generation ────────────────────────────────────────
FROM node:20 AS prisma

WORKDIR /app

# Install all dependencies including prisma CLI
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate prisma client
RUN npx prisma generate

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20 AS production

# Install dumb-init
RUN apt-get update && \
    apt-get install -y dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user
RUN groupadd -r appgroup && \
    useradd -r -g appgroup appuser

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy application source
COPY . .

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]