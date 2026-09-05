# ============================================================
# Stage 1: dependencies
# ============================================================
FROM node:24-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm install

# ============================================================
# Stage 2: builder
# ============================================================
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

# Placeholder untuk prisma generate (generate tidak terhubung ke DB).
ENV DATABASE_URL="mysql://build:build@node:3306/build"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 3: runner (produksi)
# ============================================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl \
    && addgroup -S nodejs \
    && adduser -S nextjs -G nodejs \
    && chown nextjs:nodejs /app

COPY --chown=nextjs:nodejs package.json package-lock.json ./
USER nextjs
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/generated ./generated
COPY --chown=nextjs:nodejs --from=builder /app/next.config.ts ./next.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "/app/docker-entrypoint.sh"]