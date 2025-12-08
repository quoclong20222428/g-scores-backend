#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# Retry logic to wait for database
for i in 1 2 3 4 5; do
  if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  echo "Database not ready, waiting... ($i/5)"
  sleep 2
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run db:seed || echo "Seed script failed, but continuing..."

echo "Starting application..."
exec node dist/server.js
