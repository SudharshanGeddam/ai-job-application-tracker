# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Full environment with dev tools to install all deps and generate Prisma client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer.
# If only source code changes (not package.json), npm install won't re-run.
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies like prisma CLI)
RUN npm ci

# Generate Prisma Client inside the container (platform-specific binaries for Linux)
# Uses a placeholder URL since the real DB isn't available at build time
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npx prisma generate

# Copy the rest of the source code
COPY . .

# ─── Stage 2: Production ──────────────────────────────────────────────────────
# Lean image — only production dependencies, no dev tools
FROM node:20-alpine AS production

# Set Node environment to production — disables dev-only features,
# enables optimizations, and prevents accidental dev dependencies from loading
ENV NODE_ENV=production

WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install ONLY production dependencies — skips devDependencies (nodemon, prisma CLI, etc.)
# npm ci is faster and more reliable than npm install for CI/CD
RUN npm ci --omit=dev

# Copy the Prisma schema and the generated client from the builder stage
COPY prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source code
COPY src ./src
COPY index.js ./

# ─── Expose & Start ───────────────────────────────────────────────────────────
EXPOSE 3000

# Run migrations (applies any pending DB schema changes) then start the server
# prisma migrate deploy is safe for production — it only runs new migrations, never rolls back
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]