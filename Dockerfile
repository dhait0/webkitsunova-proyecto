FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3002 5173
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
EXPOSE 3002
CMD ["npx", "tsx", "src/server/server.ts"]
