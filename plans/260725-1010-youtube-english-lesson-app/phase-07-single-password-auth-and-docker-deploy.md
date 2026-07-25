# Phase 07 — Single-password auth + Docker Compose + VPS deploy

## Context Links
- Plan overview: [plan.md](./plan.md)
- Blocked by: [Phase 04](./phase-04-transcript-source-and-ingest-pipeline.md), [Phase 05](./phase-05-lesson-page-four-tabs-player-seek.md), [Phase 06](./phase-06-flashcard-review-fsrs.md) (gate everything at once, once routes exist)

## Overview
- **Priority:** P1 — **must ship before the app is reachable from the internet.** An ungated ingest endpoint spends the user's Gemini budget for anyone who finds it.
- **Status:** pending
- **Effort:** 3h
- **Description:** One shared password gate over the whole app, then containerize (app + postgres) and document VPS deployment.

## Key Insights
- **Auth is ONE shared password from an env var.** No accounts, no OAuth, no registration, no password reset, no sessions table (settled product decision). Do NOT reach for NextAuth/Auth.js — it is an order of magnitude more machinery than this needs. A signed HttpOnly cookie is the whole design.
- The gate's real job is **protecting the API budget**, not protecting secrets. That reframes the priority: it must exist before public exposure, and it must cover server actions (which are POST endpoints, callable directly) — not just page renders. Gating only the UI would leave `ingest-lesson-action` wide open.
- **Middleware is the right place**: one `middleware.ts` matching all routes except `/login` and static assets. Centralized, so a new route is protected by default rather than by remembering to add a check. Default-deny beats default-allow.
- Middleware runs on the Edge runtime → **no Node `crypto` module**. Use Web Crypto (`crypto.subtle`) for HMAC signature verification, or keep the cookie value an opaque HMAC computed in a Node route handler and verified in middleware with Web Crypto. Do not import `bcrypt`/`node:crypto` into middleware — it will fail at build or runtime.
- Cookie must be **HttpOnly + Secure + SameSite=Lax**, signed (HMAC over a fixed payload + issued-at) so it can't be forged by simply setting `auth=true` in devtools. Signing key: derive from `APP_PASSWORD` or add a separate `AUTH_SECRET`. Prefer a separate `AUTH_SECRET` — then changing the password doesn't silently invalidate the signing scheme, and the password is never itself the key material.
- Compare the submitted password in **constant time** and rate-nothing-else. Timing attacks on a single-user app are near-theoretical, but `timingSafeEqual` is one line.
- **Docker: multi-stage build + Next.js `output: "standalone"`.** Standalone output is what keeps the runtime image small; without it the image carries all of `node_modules`. Target **x86_64** (confirmed — the spec's open ARM/x86 question is answered).
- **Migrations in deploy, never `db push`.** The container entrypoint runs `prisma migrate deploy` (not `migrate dev`, which is interactive/dev-only and can create migrations). This is the production half of the hard user rule from Phase 02.
- Postgres data must live on a **named volume**, or a `docker compose down` destroys every lesson the user paid tokens to generate. This is the single most damaging misconfiguration available in this phase.

## Requirements

### Functional
- Unauthenticated request to any app route → redirect to `/login`.
- Correct password → signed HttpOnly cookie set → redirected to the originally requested path.
- Wrong password → generic error, no hint about what was wrong.
- Server actions and route handlers reject unauthenticated callers (not merely hidden from the UI).
- Logout clears the cookie.
- `docker compose up -d` brings up app + postgres, runs pending migrations, serves the app.
- Postgres data survives container restarts and recreation.

### Non-functional
- Files < 200 lines.
- No secrets in the image or in git; all via `.env` on the VPS.
- Cookie lifetime long (e.g. 30 days) — single user on his own devices; frequent re-login is pure friction.
- Deploy documented well enough to repeat from scratch.

## Architecture

```
middleware.ts                          # ROOT: default-deny all routes
src/lib/auth/
  auth-cookie.ts                       # cookie name, sign/verify via Web Crypto (edge-safe)
  verify-password.ts                   # constant-time compare vs env.APP_PASSWORD (node only)
  require-auth.ts                      # guard for server actions / route handlers
src/app/login/page.tsx                 # password form
src/app/api/login/route.ts             # POST: verify -> set cookie
src/app/api/logout/route.ts            # POST: clear cookie
Dockerfile                             # multi-stage, standalone output
docker-compose.yml                     # app + postgres + named volume
docker-entrypoint.sh                   # prisma migrate deploy && node server.js
docs/deployment.md                     # VPS runbook
```

### Auth flow
```
GET /lessons/abc  (no cookie)
 └─ middleware: verify cookie -> fail
     └─ 307 -> /login?next=/lessons/abc

POST /api/login { password }
 └─ verify-password (constant-time vs APP_PASSWORD)
     ├─ ok  -> Set-Cookie: session=<HMAC payload>; HttpOnly; Secure; SameSite=Lax; Max-Age=30d
     │          -> redirect to `next` (validated to be a same-origin relative path)
     └─ bad -> 401, generic message

server action invoked directly (no cookie)
 └─ requireAuth() throws -> action rejects        [budget protection]
```

`next` param must be validated as a relative path starting with `/` and not `//` — otherwise it's an open-redirect.

### Container topology
```
docker-compose.yml
├─ postgres:17-alpine
│   volumes: pgdata:/var/lib/postgresql/data      <-- NAMED VOLUME, non-negotiable
│   healthcheck: pg_isready
├─ app  (build: .)
│   depends_on: postgres (condition: service_healthy)
│   env_file: .env
│   ports: "3000:3000"                            <-- bind 127.0.0.1 if fronted by a reverse proxy
│   entrypoint: prisma migrate deploy && node server.js
volumes: { pgdata: }
```
`DATABASE_URL` inside compose points at host `postgres`, not `localhost` — a classic mistake worth stating: the app container's `localhost` is itself.

## Related Code Files

**Create:**
- `middleware.ts` (project root, or `src/middleware.ts` with src dir)
- `src/lib/auth/auth-cookie.ts`
- `src/lib/auth/verify-password.ts`
- `src/lib/auth/require-auth.ts`
- `src/app/login/page.tsx`
- `src/app/api/login/route.ts`
- `src/app/api/logout/route.ts`
- `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-entrypoint.sh`
- `docs/deployment.md`

**Modify:**
- `next.config.ts` — add `output: "standalone"`
- `src/lib/env.ts` — add `AUTH_SECRET` to the Zod schema
- `.env.example` — add `AUTH_SECRET`
- `src/app/actions/*.ts` (all three: ingest, save-vocab, grade) — call `requireAuth()` first
- Root layout — logout button

**Delete:** none.

## Implementation Steps

1. Add `AUTH_SECRET` to `env.ts` schema (min 32 chars) and to `.env.example`. Document generating it: `openssl rand -hex 32`.
2. `auth-cookie.ts`: `signSession()` / `verifySession()` using Web Crypto HMAC-SHA256 over `issuedAt`, base64url-encoded, `AUTH_SECRET` as key. Edge-compatible — **no `node:crypto` import**.
3. `verify-password.ts`: constant-time compare of submitted password vs `env.APP_PASSWORD` (Node runtime only; used by the route handler, not middleware).
4. `middleware.ts`: matcher covering everything except `/login`, `/api/login`, `/_next/*`, favicon/static. Verify cookie; on failure redirect to `/login?next=<path>`. Keep it tiny — middleware runs on every request.
5. `api/login/route.ts`: POST, parse password, verify, set cookie, redirect to validated `next` (must start with `/`, must not start with `//`). Generic 401 on failure.
6. `api/logout/route.ts`: clear cookie, redirect `/login`.
7. `login/page.tsx`: minimal centered card, single password Input + Button, shows a generic error.
8. `require-auth.ts`: reads the cookie via `next/headers`, verifies, throws if invalid. Add the call to the top of **all three** server actions. Grep `"use server"` afterwards to confirm none was missed — a missed one is an open endpoint.
9. `next.config.ts`: `output: "standalone"`.
10. `Dockerfile`, multi-stage:
    - deps: `node:24-alpine`, `pnpm install --frozen-lockfile`
    - build: `pnpm prisma generate && pnpm build`
    - runtime: `node:24-alpine`, copy `.next/standalone`, `.next/static`, `public`, `prisma/`, non-root user, `CMD ["./docker-entrypoint.sh"]`
    - Prisma needs its schema + migrations present at runtime for `migrate deploy` — copy `prisma/` into the runtime stage. Easy to forget; `migrate deploy` then fails at boot.
11. `.dockerignore`: `node_modules`, `.next`, `.git`, `.env`, `plans`, `docs`. **`.env` must be excluded** so the key is never baked into an image layer.
12. `docker-entrypoint.sh`: `npx prisma migrate deploy && exec node server.js`. Fail hard if the migration fails — booting an app against a stale schema is worse than not booting.
13. `docker-compose.yml` per the topology above: named `pgdata` volume, `pg_isready` healthcheck, `depends_on: service_healthy`, `env_file: .env`, `restart: unless-stopped`.
14. `docs/deployment.md`: prerequisites; clone; write `.env` (generate `AUTH_SECRET`, set `APP_PASSWORD`, `GEMINI_API_KEY`, in-compose `DATABASE_URL`); `docker compose up -d --build`; verify; reverse proxy + TLS notes (Caddy/nginx — **HTTPS is required for the `Secure` cookie to be sent at all**); backup command for `pgdata` (`pg_dump`); upgrade procedure (pull, rebuild, migrations auto-apply).
15. Test locally as far as possible — **Docker is not installed on this Windows machine**, so container verification happens on the VPS. Test auth + middleware locally with `pnpm dev`; note explicitly in `docs/deployment.md` that the first container build is validated on the VPS.
16. Auth test matrix: no cookie → redirect; wrong password → 401 generic; correct → cookie set, lands on `next`; forged cookie (`session=anything`) → rejected; server action called with no cookie (curl POST) → rejected; logout → subsequent request redirects.
17. `pnpm typecheck` + `pnpm build`. Commit: `feat: add password gate and docker deployment`.

## Todo List
- [ ] `AUTH_SECRET` in env schema + `.env.example`
- [ ] `auth-cookie.ts` (Web Crypto, edge-safe, HMAC-signed)
- [ ] `verify-password.ts` (constant-time)
- [ ] `middleware.ts` default-deny matcher
- [ ] `api/login` with validated `next` (open-redirect guard)
- [ ] `api/logout`
- [ ] `login/page.tsx`
- [ ] `require-auth.ts` added to ALL THREE server actions (grep to confirm)
- [ ] `output: "standalone"`
- [ ] Dockerfile multi-stage (copies `prisma/` into runtime)
- [ ] `.dockerignore` excludes `.env`
- [ ] `docker-entrypoint.sh` runs `migrate deploy`, fails hard
- [ ] `docker-compose.yml` with NAMED pgdata volume + healthcheck
- [ ] `docs/deployment.md` incl. TLS + backup + upgrade
- [ ] Auth test matrix (6 cases, incl. forged cookie + curl'd action)
- [ ] `pnpm typecheck` + `pnpm build` green
- [ ] Commit

## Success Criteria
- Every route and all three server actions reject unauthenticated access; verified for actions by raw `curl` POST, not just by clicking the UI.
- A hand-forged cookie value is rejected (proves signing works, not just presence-checking).
- Correct password lands the user on the originally requested page; `?next=//evil.com` does not redirect off-site.
- On the VPS: `docker compose up -d --build` yields a working app; `docker compose restart` and `docker compose down && up` both preserve all lessons and flashcards.
- Migrations apply automatically on boot; `prisma migrate status` clean inside the container.
- `docker history` shows no `.env` / no API key in any layer.
- No `db push` anywhere in Dockerfile, entrypoint, compose, or docs.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **App exposed publicly before auth lands** | Med | **High** (open Gemini budget) | This phase is P1 and gated before public DNS/proxy; Phases 04/05 both note localhost-only until now |
| Server actions unprotected while pages are gated | Med | **High** | `requireAuth()` in every action + grep verification; middleware alone is not treated as sufficient |
| `node:crypto` in middleware breaks Edge build | **High** | Med | Web Crypto only; called out in step 2 |
| Cookie unsigned → trivially forged | Med | **High** | HMAC signature + explicit forged-cookie test |
| Open redirect via `next` | Med | Med | Validate relative-path-only |
| **Postgres volume not named → data loss on `down`** | Med | **High** (irrecoverable paid content) | Named `pgdata` volume + explicit down/up persistence test + documented `pg_dump` backup |
| `DATABASE_URL` points at `localhost` inside container | **High** | Med | Compose uses host `postgres`; called out explicitly |
| `prisma/` missing in runtime image → boot failure | Med | Med | Step 10 copies it; entrypoint failure is loud |
| `Secure` cookie never sent over plain HTTP | Med | Med | `docs/deployment.md` requires TLS; note the symptom (login appears to succeed but never sticks) |
| Docker untestable locally (not installed) | **High** (certain) | Low | Validate on VPS; documented in step 15 |

## Security Considerations
- One shared password is a deliberate, accepted design for a single-user app. Its main job is budget protection.
- Cookie: HttpOnly (no JS access), Secure (TLS only), SameSite=Lax (CSRF mitigation for the POST actions), HMAC-signed (unforgeable).
- Constant-time password compare.
- Generic auth errors — never reveal whether a password was close, or that a route exists.
- Secrets: `.env` gitignored (already) AND dockerignored (new). Never `ARG`/`ENV` a secret in the Dockerfile — build args persist in image history.
- Run the container as a non-root user.
- Bind the app port to `127.0.0.1` and terminate TLS at a reverse proxy; do not expose `3000` to the world.
- No rate limiting on login. Accepted per user's explicit waiver of throttling features, and a long random password makes online brute force impractical — but note honestly: this is the one place a rate limit would have real value, so pick a strong `APP_PASSWORD` (documented in `docs/deployment.md`).
- Postgres port must NOT be published to the host/internet in compose; app-to-db traffic stays on the internal compose network.

## Next Steps
- Phase 08 (tests) is the last phase; auth helpers and the URL parser are prime unit-test targets.
- After deploy: paste a real lesson on the VPS end-to-end as the final acceptance check.
