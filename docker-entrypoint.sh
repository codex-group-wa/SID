#!/bin/sh

set -e

# Default to root, so old installations won't break
export PUID=${PUID:-0}
export PGID=${PGID:-0}

# Create database directory if it doesn't exist
mkdir -p /app/data

# Check if database file exists
if [ ! -f /app/data/database.db ]; then
  echo "Database file not found. Running Prisma migrations to create it..."
  
  # Run Prisma migrations to create the database schema
  npx prisma migrate deploy
  
  # Or if you don't have migrations set up, you can just initialize the database
  # npx prisma db push
  
  echo "Database initialization complete."
else
  echo "Using existing database file."
fi

# This is in attempt to preserve the original behavior of the Dockerfile,
# while also supporting the lscr.io /config directory
[ ! -d "/app/config" ] && ln -s /config /app/config

export HOMEPAGE_BUILDTIME=$(date +%s)

# Set privileges for /app but only if pid 1 user is root and we are dropping privileges.
# If container is run as an unprivileged user, it means owner already handled ownership setup on their own.
# Running chown in that case (as non-root) will cause error
[ "$(id -u)" == "0" ] && [ "${PUID}" != "0" ] && chown -R ${PUID}:${PGID} /app/config /app/public

# Drop privileges (when asked to) if root, otherwise run as current user
if [ "$(id -u)" == "0" ] && [ "${PUID}" != "0" ]; then
  su-exec ${PUID}:${PGID} "$@"
else
  exec "$@"
fi