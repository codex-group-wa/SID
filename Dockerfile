# =========================
# Builder Stage
# =========================
FROM node:22-slim AS builder
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Setup
RUN mkdir -p config
COPY . .

ARG CI
ARG BUILDTIME
ARG VERSION
ARG REVISION
ENV CI=$CI

# Install dependencies and build
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --prefer-offline && \
    pnpm install better-sqlite3@12.2.0 \
    npx prisma generate && \
    NEXT_TELEMETRY_DISABLED=1 pnpm run build

# =========================
# Runtime Stage
# =========================
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.title="SID"
LABEL org.opencontainers.image.description="Manage your docker deployments with SID"
LABEL org.opencontainers.image.url="https://github.com/declan-wade"
LABEL org.opencontainers.image.documentation="https://github.com/declan-wade"
LABEL org.opencontainers.image.source="https://github.com/declan-wade"
LABEL org.opencontainers.image.licenses='Apache-2.0'

# Setup
WORKDIR /app

# Create database directory
RUN mkdir -p /app/data

# Install Docker CLI and other dependencies
RUN apk add --no-cache openssl docker-cli su-exec sqlite
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Copy public directory from context
COPY --link --chown=1000:1000 public ./public/
COPY --link --chmod=755 docker-entrypoint.sh /usr/local/bin/

# Copy Next.js build output from builder
COPY --link --from=builder --chown=1000:1000 /app/.next/standalone/ ./
COPY --link --from=builder --chown=1000:1000 /app/.next/static/ ./.next/static
#COPY --link --from=builder --chown=1000:1000 /app/node_modules/.prisma ./node_modules/.prisma
COPY --link --from=builder --chown=1000:1000 /app/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3 ./node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3
COPY --link --from=builder --chown=1000:1000 /app/prisma ./prisma

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Set database URL to use the data directory
ENV DATABASE_URL=file:/app/data/database.db

EXPOSE $PORT

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:$PORT/api/healthcheck || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
