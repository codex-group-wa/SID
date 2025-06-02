#!/bin/sh

set -e

echo "[entrypoint] Starting docker-entrypoint.sh..."

# Default to root, so old installations won't break
export PUID=${PUID:-0}
export PGID=${PGID:-0}
echo "[entrypoint] Using PUID=${PUID}, PGID=${PGID}"

# Create database directory if it doesn't exist
if [ ! -d /app/data ]; then
  echo "[entrypoint] Creating /app/data directory..."
  mkdir -p /app/data
else
  echo "[entrypoint] /app/data directory already exists."
fi

# Check if database file exists
if [ ! -f /app/data/database.db ]; then
  echo "[entrypoint] Database file not found. Running Prisma migrations to create it..."
  
  # Run Prisma migrations to create the database schema
  npx prisma migrate deploy
  
  # Or if you don't have migrations set up, you can just initialize the database
  # npx prisma db push
  
  echo "[entrypoint] Database initialization complete."
else
  echo "[entrypoint] Using existing database file."
fi

# This is in attempt to preserve the original behavior of the Dockerfile,
# while also supporting the lscr.io /config directory
if [ ! -d "/app/config" ]; then
  echo "[entrypoint] /app/config does not exist, creating symlink to /config"
  ln -s /config /app/config
else
  echo "[entrypoint] /app/config already exists."
fi

export HOMEPAGE_BUILDTIME=$(date +%s)
echo "[entrypoint] HOMEPAGE_BUILDTIME set to $HOMEPAGE_BUILDTIME"

# Set privileges for /app but only if pid 1 user is root and we are dropping privileges.
# If container is run as an unprivileged user, it means owner already handled ownership setup on their own.
# Running chown in that case (as non-root) will cause error
if [ "$(id -u)" = "0" ] && [ "${PUID}" != "0" ]; then
  echo "[entrypoint] Running chown for /app/config and /app/public to ${PUID}:${PGID}"
  chown -R ${PUID}:${PGID} /app/config /app/public
else
  echo "[entrypoint] Skipping chown (not running as root or PUID is 0)"
fi

# Drop privileges (when asked to) if root, otherwise run as current user
if [ "$(id -u)" = "0" ] && [ "${PUID}" != "0" ]; then
  echo "[entrypoint] Dropping privileges to ${PUID}:${PGID} using su-exec"
  su-exec ${PUID}:${PGID} "$@"
else
  echo "[entrypoint] Executing as current user (UID: $(id -u))"
  exec "$@"
fi