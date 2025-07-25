# Use the official Node.js Alpine image as base
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (skip postinstall scripts to avoid Prisma generate)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install required packages including Docker CLI
RUN apk add --no-cache docker-cli docker-cli-compose su-exec git

# Don't run production as root
#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nextjs

# Add nextjs user to docker group for Docker socket access
#RUN addgroup -g 999 docker || true
#RUN adduser nextjs docker

# Copy the public folder from the project as this is not included in the build process
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
#RUN chown nextjs:nodejs .next

# Copy the build output (this includes node_modules and server.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema for potential runtime needs
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Install pnpm in the final stage for migrations
RUN npm install -g pnpm prisma

ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV NODE_ENV production

RUN ls -la /app/

# Start the application with migrations
CMD ["sh", "-c", "echo 'Running Prisma migrations...' && npx prisma migrate deploy && echo 'Starting Next.js server...' && exec node server.js"]
