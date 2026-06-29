# ─── Stage 1: Dependencies ────────────────────────────────
# install production dependencies only
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# install production deps only — no jest, eslint etc
RUN npm ci --omit=dev

# ─── Stage 2: Prisma client generation ────────────────────
# separate stage to generate prisma client
FROM node:20-alpine AS prisma

WORKDIR /app

COPY package.json package-lock.json ./

# install all deps including devDependencies for prisma generate
RUN npm ci

COPY prisma ./prisma

# generate prisma client
RUN npx prisma generate

# ─── Stage 3: Production ──────────────────────────────────
# final small image — only what's needed to run the app
FROM node:20-alpine AS production

# install dumb-init (process manager) and curl (for healthcheck)
# dumb-init handles signals properly inside container
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# create non-root user for security
# running as root inside container is dangerous
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# copy prisma generated client from prisma stage
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma/client ./node_modules/@prisma/client

# copy prisma schema (needed for migrations)
COPY --from=prisma /app/prisma ./prisma

# copy source code
COPY . .

# give ownership of all files to appuser
RUN chown -R appuser:appgroup /app

# switch to non-root user
USER appuser

# expose port app runs on
EXPOSE 3000

# health check — GitHub Actions uses this to confirm app is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# dumb-init as entrypoint — handles signals properly
ENTRYPOINT ["dumb-init", "--"]

# start the app
CMD ["sh", "start.sh"]