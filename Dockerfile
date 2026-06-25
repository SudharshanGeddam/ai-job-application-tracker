# =========================
# Builder Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npx prisma generate

COPY . .

# =========================
# Production Stage
# =========================
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./

RUN npm ci --omit=dev

COPY prisma ./prisma/

# Copy generated Prisma engine/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY src ./src
COPY index.js ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]