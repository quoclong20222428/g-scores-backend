# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=optional

# Copy source code
COPY . .

# Generate Prisma client (set dummy DATABASE_URL for build)
RUN DATABASE_URL="postgresql://user:password@localhost:5432/dummy" npm run db:generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files from builder
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --omit=optional && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Copy entrypoint script
COPY docker-entrypoint-app.sh ./

# Make entrypoint script executable
RUN chmod +x ./docker-entrypoint-app.sh

# Install psql for health checks
RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

# Use entrypoint script with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "sh", "./docker-entrypoint-app.sh"]
