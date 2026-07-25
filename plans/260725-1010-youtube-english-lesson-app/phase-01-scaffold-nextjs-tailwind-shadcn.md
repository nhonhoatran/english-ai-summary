# Phase 01 — Scaffold Next.js + TS + Tailwind/shadcn + env config

## Context Links
- Plan overview: [plan.md](./plan.md)
- Verified spec: `D:\MyProject\english-summary\plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md`
- Project rules: `.claude/rules/development-rules.md` (200-line file cap, kebab-case)

## Overview
- **Priority:** P1 (blocks everything)
- **Status:** completed
- **Effort:** 1h
- **Description:** Greenfield scaffold. Project dir currently holds only config dirs (`.claude`, `.cursor`, `.agent`, `.agents`, `.opencode`, `.playwright-mcp`), `plans/`, plus an already-written `.env.example` and `.gitignore`. Stand up Next.js App Router + TS + Tailwind + shadcn/ui, wire env validation, init git.

## Key Insights
- `.env.example` and `.gitignore` ALREADY EXIST and are correct — do NOT overwrite. `.gitignore` already ignores `.env`, `node_modules/`, `.next/`. `.env.example` already declares `GEMINI_API_KEY`, `APP_PASSWORD`, `DATABASE_URL`.
- Verified installed: Node v24.15.0, pnpm 11.3.0. Docker NOT installed locally — fine, Docker is VPS-only (Phase 07).
- `create-next-app` refuses to scaffold into a dir with conflicting files. The existing dirs are dotfiles/`plans` and are tolerated, but verify before running — if it refuses, scaffold to a temp dir and move files in.
- Not a git repo yet. `git init` here, before any dependency install, so the first commit is clean.
- Env vars must be validated at boot, not read raw with `process.env.X!` scattered around. One tiny Zod module, imported everywhere.

## Requirements

### Functional
- `pnpm dev` serves a Next.js app on localhost.
- `pnpm build` and `pnpm typecheck` pass with zero errors.
- Tailwind utility classes render; at least 3 shadcn/ui primitives installed and importable.
- Importing `env` from the config module throws a descriptive error at startup if `GEMINI_API_KEY`, `APP_PASSWORD`, or `DATABASE_URL` is missing.

### Non-functional
- Every file under 200 lines.
- kebab-case filenames for all `.ts`/`.tsx`.
- TypeScript `strict: true`.
- No secret values committed; only `.env.example` placeholders.

## Architecture

```
src/
  app/
    layout.tsx           # root layout, font + globals.css
    page.tsx             # placeholder home (real home = Phase 05)
    globals.css          # tailwind directives + shadcn CSS vars
  components/ui/         # shadcn generated primitives (untouched by us)
  lib/
    env.ts               # zod-validated process.env, single export `env`
    utils.ts             # shadcn `cn()` helper
```

Env flow: `process.env` → `lib/env.ts` (Zod parse, fails fast) → typed `env` object → consumed by db client (Phase 02), Gemini client (Phase 03), auth (Phase 07). Nothing else reads `process.env` directly.

## Related Code Files

**Create:**
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `components.json` (shadcn), `.prettierrc` (optional)
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/lib/env.ts`, `src/lib/utils.ts`
- `README.md` (one-paragraph what/how-to-run)

**Modify:**
- `.gitignore` — append only if something is genuinely missing after scaffold (e.g. `.env.production`, `next-env.d.ts` is normally committed so leave it).
- `.env.example` — leave as-is unless a new var appears in a later phase.

**Delete:** none.

## Implementation Steps

1. `cd D:\MyProject\english-summary` and run `git init`.
2. Confirm no name collisions: list dir; only dotfolders + `plans/` + `.env.example` + `.gitignore` should exist.
3. Scaffold:
   ```powershell
   pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
   ```
   If it aborts on existing files, scaffold into `..\_scaffold-tmp`, then move all generated files/dirs in, preserving the existing `.gitignore` and `.env.example`.
4. Verify Tailwind is v4 (`postcss.config.mjs` + `@import "tailwindcss"` in `globals.css`) vs v3 (`tailwind.config.ts`), and note which, since shadcn init differs.
5. Init shadcn: `pnpm dlx shadcn@latest init` (defaults: neutral base color, CSS variables yes).
6. Add primitives needed by later phases:
   `pnpm dlx shadcn@latest add button card input tabs badge dialog skeleton toast`
   (Tabs → Phase 05 lesson tabs; Button/Card → quiz + flashcards; Input → URL paste + password.)
7. Add `zod`: `pnpm add zod`.
8. Write `src/lib/env.ts`:
   ```ts
   import { z } from "zod";

   const schema = z.object({
     DATABASE_URL: z.string().min(1),
     GEMINI_API_KEY: z.string().min(1),
     APP_PASSWORD: z.string().min(8),
     GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
   });

   const parsed = schema.safeParse(process.env);
   if (!parsed.success) {
     throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
   }
   export const env = parsed.data;
   ```
   Note: `GEMINI_MODEL` added as env-overridable because the exact available model ID is unconfirmed until the Phase 03 probe — see plan.md unresolved questions.
9. Append `GEMINI_MODEL=gemini-3.6-flash` to `.env.example` (this is the one allowed edit to that file).
10. Create local `.env` from `.env.example` and fill real values. Confirm `git status` does NOT list `.env`.
11. Add scripts to `package.json`: `"typecheck": "tsc --noEmit"`, keep `dev`/`build`/`start`/`lint`.
12. Run `pnpm typecheck` and `pnpm build`. Fix until both clean.
13. First commit: `chore: scaffold next.js app with tailwind and shadcn`.

## Todo List
- [x] `git init`
- [x] Verify no scaffold file collisions
- [x] `create-next-app` with App Router + src dir + TS + Tailwind
- [x] Record Tailwind major version (v3 vs v4)
- [x] `shadcn init`
- [x] Add button/card/input/tabs/badge/dialog/skeleton/toast
- [x] `pnpm add zod`
- [x] Write `src/lib/env.ts` with fail-fast Zod parse
- [x] Append `GEMINI_MODEL` to `.env.example`
- [x] Create real `.env`, confirm it is gitignored
- [x] Add `typecheck` script
- [x] `pnpm typecheck` + `pnpm build` green
- [x] Commit

## Success Criteria
- `pnpm dev` → page loads at http://localhost:3000 with a visibly Tailwind-styled element.
- `pnpm typecheck` exits 0. `pnpm build` exits 0.
- Deleting `GEMINI_API_KEY` from `.env` makes the app throw a message naming that variable.
- `git status --porcelain` shows no `.env`, no `node_modules`.
- All new files < 200 lines.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `create-next-app` refuses due to existing dotdirs | Med | Low | Scaffold to temp dir, move files in; keep existing `.gitignore`/`.env.example` |
| Tailwind v4 vs v3 breaking shadcn init | Med | Med | Detect version at step 4; use shadcn's version-matched init; if v4 friction is high, pin Tailwind v3 |
| `.env` accidentally committed | Low | **High** | `.gitignore` already covers it; verify with `git status` at step 10 before first commit |
| Node 24 unsupported by a dep | Low | Med | Node 24 is current LTS-line; if a dep breaks, pin to Node 22 via `.nvmrc` + Docker base image (Phase 07) |

## Security Considerations
- `APP_PASSWORD` min length 8 enforced in schema (real gate is Phase 07).
- `GEMINI_API_KEY` must only ever be read server-side. Never prefix any secret with `NEXT_PUBLIC_`. Add this as a review checkpoint — a `NEXT_PUBLIC_GEMINI_API_KEY` would leak the key to every browser.
- `lib/env.ts` is server-only; do not import it into a Client Component (would attempt to bundle secrets). Keep all env reads behind server actions / route handlers.

## Next Steps
- Unblocks Phase 02 (Prisma needs `DATABASE_URL` + a working TS build) and Phase 03 (Gemini client needs `env`).
- Phase 02 can start immediately after this commit.
