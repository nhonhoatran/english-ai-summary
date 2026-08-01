# 1. Dependencies (dev + prod) — used to build the app
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# 2. Production dependencies in a flat (hoisted) node_modules
# pnpm's default symlinked layout cannot be copied between stages: transitive
# packages (socket.io-adapter, engine.io, .prisma, ...) only exist inside
# node_modules/.pnpm. `nodeLinker: hoisted` lays everything out flat like npm.
# pnpm 10+ reads this setting from pnpm-workspace.yaml, not from .npmrc.
FROM node:24-alpine AS prod-deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma
RUN printf '\nnodeLinker: hoisted\n' >> pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile --prod
# Generate the Prisma Client (and its linux-musl query engine) on the runtime platform
RUN pnpm prisma generate

# 3. Builder
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time only: no real secrets are available while building the image.
# Env validation is skipped here and enforced again at runtime (see src/lib/env.ts).
ENV SKIP_ENV_VALIDATION=1
# Placeholder so Prisma Client can be constructed during "collect page data".
# Never used to connect; the real DATABASE_URL is injected at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm prisma generate
RUN pnpm build
# Build cache is not needed at runtime and would bloat the image
RUN rm -rf .next/cache

# 4. Runner
FROM node:24-alpine AS runner
WORKDIR /app

# Prisma query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs package.json ./package.json
# Custom server: Next.js request handler + Socket.io for the classroom feature
COPY --chown=nextjs:nodejs server.js ./server.js

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
