#!/bin/sh
set -e

echo "=== Starting G-Scores Backend ==="

# Step 1: Generate Prisma client
echo "Step 1: Generating Prisma client..."
npm run db:generate

# Step 2: Run migrations
echo "Step 2: Running database migrations..."
npm run db:migrate -- --skip-generate

# Step 3: Seed database
echo "Step 3: Seeding database..."
npm run db:seed

# Step 4: Start the application
echo "Step 4: Starting application..."
exec node dist/server.js
