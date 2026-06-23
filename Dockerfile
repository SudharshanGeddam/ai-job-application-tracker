# ─── Stage: Base Image ───────────────────────────────────────────
# node:20-alpine = Node v20 on Alpine Linux (tiny, ~50MB vs ~900MB)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# ─── Install Dependencies ────────────────────────────────────────
# Copy ONLY package files first — Docker caches this layer.
# If your code changes but package.json doesn't, npm install
# won't re-run. This makes rebuilds much faster.
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# ─── Copy Source Code ────────────────────────────────────────────
COPY . .

# ─── Generate Prisma Client ──────────────────────────────────────
# Prisma generates platform-specific binaries.
# We MUST run this inside the container (Linux), not on Windows.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# ─── Expose & Start ──────────────────────────────────────────────
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]