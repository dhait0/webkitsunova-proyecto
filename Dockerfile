# syntax=docker/dockerfile:1

# ---- deps ------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build -----------------------------------------------------------------
FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma's client must exist before `next build` type-checks the server code.
RUN npx prisma generate && npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat openssl && addgroup -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/supabase/migrations ./supabase/migrations

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["npm", "run", "start"]
