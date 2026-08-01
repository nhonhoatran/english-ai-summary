# Dokploy & Production VPS Deployment Guide

This guide documents how to deploy the YouTube English Lesson App on Dokploy (or standalone Docker Compose) connecting to an external PostgreSQL database.

---

## Deploying on Dokploy

Dokploy manages multi-service deployments cleanly on your VPS without container naming conflicts.

### Dokploy Setup Steps:

1. **Create New Application / Compose Service in Dokploy:**
   - Select **Application** or **Compose** deployment type.
   - Point to your Git Repository branch (e.g. `main`).

2. **Environment Variables:**
   In the Dokploy Environment Variables panel, add:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   APP_PASSWORD=your_strong_password_here
   AUTH_SECRET=your_32plus_character_hex_secret
   DATABASE_URL=postgresql://user:password@host.docker.internal:5432/english_summary
   GEMINI_MODEL=gemini-3.6-flash
   ```

   > **Note for Host Postgres:** If your PostgreSQL runs directly on the VPS host OS outside Dokploy, use `host.docker.internal` as the host in `DATABASE_URL` (e.g., `postgresql://postgres:password@host.docker.internal:5432/english_summary`).

3. **Deploy:**
   - Dokploy automatically builds the image using [Dockerfile](file:///d:/MyProject/english-summary/Dockerfile) / [docker-compose.yml](file:///d:/MyProject/english-summary/docker-compose.yml).
   - Dokploy dynamically routes domain traffic via Traefik/Nginx reverse proxy directly to internal port `3000` with automatic HTTPS/TLS certificates.

---

## Standalone Docker Compose Deployment

If deploying manually without Dokploy:

### Step 1: Prepare `.env`
Create `.env` with required variables:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
APP_PASSWORD=your_strong_password_here
AUTH_SECRET=openssl_rand_hex_32_output
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/english_summary
GEMINI_MODEL=gemini-3.6-flash
```

### Step 2: Build & Start
```bash
docker compose up -d --build
```

**Boot Process:**
- Container starts up and runs `npx prisma migrate deploy` automatically applying database migrations to your PostgreSQL database.
- Custom `server.js` (Next.js request handler + Socket.io) starts on port `3000`.

**Image build notes:**
- Env validation is skipped at build time (`SKIP_ENV_VALIDATION=1` in the builder stage) because Docker builds have no secrets; `src/lib/env.ts` still validates strictly at runtime.
- Runtime dependencies are installed in a dedicated `prod-deps` stage with `nodeLinker: hoisted`, producing a flat `node_modules` that can be copied between stages. pnpm's default symlinked layout keeps transitive packages inside `node_modules/.pnpm` and cannot be copied per-package.
- Production builds run `next build --webpack`. Turbopack emits external modules under content-hashed names derived from the build-time `node_modules` layout (e.g. `@prisma/client-4e554655281e05c3`); when the runtime layout differs the module cannot be resolved and every Prisma route fails with `Failed to load external module`. See [vercel/next.js#87737](https://github.com/vercel/next.js/issues/87737). Webpack emits a plain `require("@prisma/client")`, which resolves in any layout.

---

## Database Migration & Upgrades

When pushing code updates:
- Dokploy auto-triggers build on `git push`.
- Prisma migrations execute automatically on startup via `docker-entrypoint.sh`.
