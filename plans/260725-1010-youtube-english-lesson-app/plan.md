---
title: "YouTube English Lesson App"
description: "Paste a YouTube link once, get a permanent elllo-style lesson page (script/grammar/quiz/vocab) plus FSRS flashcard review."
status: pending
priority: P1
effort: 23h
branch: none (not a git repo yet — Phase 01 runs git init)
tags: [nextjs, prisma, gemini, fsrs, elllo, greenfield]
created: 2026-07-25
---

# YouTube English Lesson App

**Problem:** user watches YouTube English lessons, learns vocab, forgets it — because reviewing means re-watching the whole video from the start.

**Solution:** paste a YouTube URL once → AI generates a permanent lesson page → every later review is an instant DB read.

## Core architectural invariant

**AI runs EXACTLY ONCE, at ingest.** Transcript, grammar, quiz and vocab are persisted to Postgres. Re-opening a lesson hits **only the database — zero AI calls, instant load**. This is the entire point of the app. Any code path that calls Gemini outside ingest is a bug.

## Scope

4 tabs per lesson: **Script** (timestamped, click a line → player seeks), **Grammar** (elllo-exact: ONE theme → 4 points → 4 *invented* examples each), **Quiz** (elllo-exact: 5 gap-fills, 3 in-domain options), **Vocabulary** (our own design, save-to-deck). Plus a global **FSRS flashcard queue** pooling vocab from all lessons, and a **lesson list** home.

Single user, one shared password. One video at a time, under 20 min. Explicitly **out of scope**: playlists, Vietnamese translation, quota metering/rate limiting, user accounts.

## Stack

Next.js App Router + TS · Postgres + Prisma · Tailwind + shadcn/ui · `@google/genai@2.13.0` (Interactions API) · `ts-fsrs@5.4.1` · `@danielxceron/youtube-transcript@1.2.6` · Docker Compose (x86_64 VPS)

## Phases

| # | Phase | Priority | Effort | Status | Depends on |
|---|---|---|---|---|---|
| 01 | [Scaffold Next.js + Tailwind/shadcn + env](./phase-01-scaffold-nextjs-tailwind-shadcn.md) | P1 | 1h | pending | — |
| 02 | [Postgres + Prisma schema + migration](./phase-02-postgres-prisma-schema-migration.md) | P1 | 2h | pending | 01 |
| 03 | [Gemini integration + **THE PROBE** + prompts](./phase-03-gemini-integration-probe-and-prompts.md) | P1 | 4h | pending | 01 |
| 04 | [Caption fetch + ingest pipeline](./phase-04-transcript-source-and-ingest-pipeline.md) | P1 | 3h | pending | 02, 03 |
| 05 | [Lesson UI: 4 tabs + player seek](./phase-05-lesson-page-four-tabs-player-seek.md) | P1 | 4h | pending | 02, 04 |
| 06 | [Flashcard review with ts-fsrs](./phase-06-flashcard-review-fsrs.md) | P2 | 3h | pending | 02, 05 |
| 07 | [Password auth + Docker + VPS deploy](./phase-07-single-password-auth-and-docker-deploy.md) | P1 | 3h | pending | 04, 05, 06 |
| 08 | [Tests](./phase-08-tests.md) | P2 | 3h | pending | 01–07 |

**Parallelism:** 02 and 03 can run concurrently after 01 (no shared files). Everything else is sequential.

## Key dependencies & hard rules

- **Phase 03 THE PROBE is the biggest unknown** — it is unconfirmed whether Gemini accepts video input **and** `response_format` JSON schema in one request. Probe with the real key before designing around either answer. Mitigation is structural: `generateLesson()` is the single entry point and hides 1-call vs 2-call from all callers.
- **Gemini API shape:** `ai.interactions.create({ model, input: [{type:"text",text},{type:"video",uri}], response_format: {type:'text', mime_type:'application/json', schema} })`, result in `interaction.output_text`. **Banned** (obsolete API, appears in the superseded researcher report): `models.generateContent`, `fileData`, `generationConfig`, `SchemaType`, `vertexai: true`.
- **Prisma: NEVER `db push`.** Every schema change is `prisma migrate dev --name ...`; production uses `migrate deploy`. No `db:push` script exists in `package.json`.
- **Transcript strategy:** YouTube captions first (cheap, exact timings) → Gemini video transcription fallback. Caption packages use unofficial APIs and *will* break; the fallback is the mitigation and Phase 04 tests it by forcing failure.
- **Secrets:** `GEMINI_API_KEY`, `APP_PASSWORD`, `AUTH_SECRET` in `.env` — gitignored (already) and dockerignored (Phase 07). Never `NEXT_PUBLIC_`.
- **Do not expose the app publicly before Phase 07** — an ungated ingest endpoint is an open Gemini budget.
- Every code file < 200 lines · kebab-case TS filenames · YAGNI/KISS/DRY · typecheck after every change.

## Resolved during planning

- **ts-fsrs `Card` fields** — confirmed from published types (`unpkg.com/ts-fsrs@5.4.1/dist/index.d.ts`), so the Phase 02 schema is not guesswork: `due, stability, difficulty, elapsed_days (deprecated), scheduled_days, learning_steps, reps, lapses, state, last_review?`.
- **VPS is x86_64** — settled, Docker base image targets it.
- **FSRS over SM-2** — the researcher report recommended SM-2; overridden per the verified spec.
- **Package versions** — re-verified on npm: `ts-fsrs@5.4.1`, `@google/genai@2.13.0`, `@danielxceron/youtube-transcript@1.2.6`.
- `.env.example` and `.gitignore` already exist and are correct — Phase 01 modifies, not creates.

## Unresolved questions

1. **Does video input + `response_format` work in ONE Gemini call?** Blocking design detail, deliberately deferred to the Phase 03 probe rather than assumed. Both branches are planned.
2. **Which model ID is available on the user's key?** Docs show `gemini-3.6-flash`; unverified against this key's tier. Mitigated by making the model env-driven (`GEMINI_MODEL`), with `gemini-2.5-flash` as the recorded fallback.
3. **Real latency for a ~20-min video** — unknown; measured in Phase 03 step 2. Drives only the Phase 04 pending-state copy, so no design blocks on it.
4. **Caption offset unit** — package docs say `offset` in ms; unverified empirically. If it is seconds, a naive `/1000` silently zeroes every timestamp. Explicit check in Phase 04 step 3.
5. **Gemini transcript timestamp accuracy** (±1–2s per forum reports, no guarantee) — affects only seek precision on the fallback path; accepted, not engineered around.
6. **Local Postgres availability for dev** — Docker isn't installed locally, so Phase 02 step 1 gates on either an existing local Postgres or a hosted dev DB. Needs the user's answer before Phase 02 starts.
