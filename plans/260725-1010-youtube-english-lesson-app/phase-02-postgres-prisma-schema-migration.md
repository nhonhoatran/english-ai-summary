# Phase 02 — Postgres + Prisma schema + first migration

## Context Links
- Plan overview: [plan.md](./plan.md)
- Verified spec: `plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md` (Part 3 — SRS choice)
- Blocked by: [Phase 01](./phase-01-scaffold-nextjs-tailwind-shadcn.md)
- Consumed by: Phase 04 (ingest writes), Phase 05 (lesson reads), Phase 06 (flashcard reads/writes)

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 2h
- **Description:** Model the persisted lesson. This schema IS the app's value proposition — AI runs once at ingest, everything after is a DB read. Schema must hold the full elllo-shaped lesson (transcript turns, 4 grammar points x 4 examples, 5 quiz questions x 3 options, vocab) plus FSRS card state.

## Key Insights
- **HARD USER RULE: never `prisma db push`.** Every schema change goes through `prisma migrate dev --name <desc>`. Reason (user, 2026-07-23): `db push` desyncs the live DB from the migration history that git tracks. Use `--create-only` when you want to review the SQL before applying. This is non-negotiable and applies to every later phase that touches `schema.prisma`.
- **FSRS Card fields are now CONFIRMED** — read from `ts-fsrs@5.4.1` published types (`https://unpkg.com/ts-fsrs@5.4.1/dist/index.d.ts`), which closes the open question in the verified spec:
  ```ts
  interface Card {
    due: Date; stability: number; difficulty: number;
    elapsed_days: number;      // @deprecated, removed in ts-fsrs 6.0.0
    scheduled_days: number; learning_steps: number;
    reps: number; lapses: number; state: State; last_review?: Date;
  }
  enum State { New = 0, Learning = 1, Review = 2, Relearning = 3 }
  enum Rating { Manual = 0, Again = 1, Hard = 2, Good = 3, Easy = 4 }
  ```
  Persist all of them, including `elapsed_days` (the library still reads it in v5). Add a comment marking it deprecated so the v6 upgrade is a known, cheap change.
- Store `state` as a Prisma enum mapped to the same 4 names, NOT a raw int — readable in psql, and the mapping to `State` is a straight cast.
- Transcript segments need `startSeconds Int` (not "MM:SS" string): the Script tab seeks the YouTube player by second (Phase 05). Store the int; format for display. Parsing "MM:SS" in the UI on every render would be pointless work.
- Quiz options: exactly 3 per question, and the elllo format blanks either a noun slot or a verb slot. A `String[]` column of options + `correctIndex Int` is simpler than a child table and satisfies the fixed-arity case. YAGNI over an `QuizOption` table.
- Grammar: 4 points per lesson, each with 4 **invented** example sentences (verified — not transcript quotes). Examples are plain strings with no back-reference to the transcript, so `String[]` on the point row is sufficient.
- Vocab is per-lesson; the flashcard deck is global (pooled across ALL lessons). So `Flashcard` is a separate row keyed to a `VocabItem` — creating a flashcard is the user's explicit "save to deck" action, and a vocab item can exist without one.

## Requirements

### Functional
- Persist one lesson per YouTube video, uniquely keyed by video id (re-pasting the same URL must not duplicate).
- Persist ordered transcript turns with speaker + start second.
- Persist exactly-4 grammar points with ordered example arrays.
- Persist exactly-5 quiz questions with 3 options + correct index.
- Persist vocab items (term, meaning, example).
- Persist FSRS state per saved flashcard + an append-only review log.
- Deleting a lesson cascades to its transcript/grammar/quiz/vocab, and to flashcards derived from its vocab.
- Track ingest status so a failed/partial generation is visible and retryable.

### Non-functional
- Loading a full lesson = ONE query (Prisma `include`), no N+1.
- Ordering deterministic everywhere (explicit `orderIndex`, never rely on insertion order).
- Migration is reversible by inspection (reviewed SQL before apply).

## Architecture

### Data model
```
Lesson (1) ──< TranscriptSegment   (orderIndex, startSeconds, speaker, text)
   │
   ├──< GrammarPoint               (orderIndex, explanation, examples String[])
   ├──< QuizQuestion               (orderIndex, prompt, options String[], correctIndex)
   └──< VocabItem ──(0..1)── Flashcard ──< ReviewLog
                                (FSRS state)   (append-only history)
```

Grammar theme lives on `Lesson.grammarTheme` — verified finding: the whole lesson centers on ONE dominant structure and the 4 points elaborate that single theme. Theme belongs to the lesson, not repeated per point.

### Write path (Phase 04)
`ingest` → single `prisma.$transaction` → `lesson.create({ data: { ...nested creates } })`. All-or-nothing: a lesson never exists with a missing Quiz tab.

### Read path (Phase 05) — the whole point of the app
`prisma.lesson.findUnique({ where: { videoId }, include: { segments, grammarPoints, quizQuestions, vocabItems } })`.
**Zero AI calls on this path.** Any future code that calls Gemini during a lesson page render is a bug.

### schema.prisma sketch
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum IngestStatus { PENDING GENERATING READY FAILED }
enum FsrsState    { New Learning Review Relearning }
enum FsrsRating   { Manual Again Hard Good Easy }

model Lesson {
  id             String   @id @default(cuid())
  videoId        String   @unique          // YouTube 11-char id, canonical key
  videoUrl       String
  title          String
  description    String?                    // 1-line, elllo-style
  durationSec    Int?
  grammarTheme   String?                    // the ONE dominant structure
  transcriptSource String                   // "youtube-captions" | "gemini"
  status         IngestStatus @default(PENDING)
  errorMessage   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  segments       TranscriptSegment[]
  grammarPoints  GrammarPoint[]
  quizQuestions  QuizQuestion[]
  vocabItems     VocabItem[]
}

model TranscriptSegment {
  id           String @id @default(cuid())
  lessonId     String
  orderIndex   Int
  startSeconds Int                          // for player.seekTo()
  speaker      String
  text         String
  lesson       Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  @@unique([lessonId, orderIndex])
  @@index([lessonId, startSeconds])
}

model GrammarPoint {
  id          String @id @default(cuid())
  lessonId    String
  orderIndex  Int                           // 1..4
  explanation String                        // one sentence
  examples    String[]                      // exactly 4, INVENTED not quoted
  lesson      Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  @@unique([lessonId, orderIndex])
}

model QuizQuestion {
  id           String @id @default(cuid())
  lessonId     String
  orderIndex   Int                          // 1..5
  prompt       String                       // gap-fill, blank as "_______"
  options      String[]                     // exactly 3
  correctIndex Int                          // 0..2
  lesson       Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  @@unique([lessonId, orderIndex])
}

model VocabItem {
  id         String @id @default(cuid())
  lessonId   String
  orderIndex Int
  term       String
  meaning    String
  example    String
  lesson     Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  flashcard  Flashcard?
  @@unique([lessonId, orderIndex])
}

model Flashcard {
  id          String @id @default(cuid())
  vocabItemId String @unique                // save-to-deck is 1:1 with a vocab item
  vocabItem   VocabItem @relation(fields: [vocabItemId], references: [id], onDelete: Cascade)

  // --- ts-fsrs Card, field names mirrored from the library ---
  due            DateTime
  stability      Float
  difficulty     Float
  elapsedDays    Int                        // maps Card.elapsed_days (deprecated in ts-fsrs 6.x)
  scheduledDays  Int
  learningSteps  Int
  reps           Int
  lapses         Int
  state          FsrsState
  lastReview     DateTime?

  createdAt   DateTime @default(now())
  reviewLogs  ReviewLog[]
  @@index([due])                            // review queue: due <= now ORDER BY due
}

model ReviewLog {
  id              String @id @default(cuid())
  flashcardId     String
  flashcard       Flashcard @relation(fields: [flashcardId], references: [id], onDelete: Cascade)
  rating          FsrsRating
  state           FsrsState
  due             DateTime
  stability       Float
  difficulty      Float
  elapsedDays     Int
  lastElapsedDays Int
  scheduledDays   Int
  learningSteps   Int
  reviewedAt      DateTime                  // maps ReviewLog.review
  @@index([flashcardId, reviewedAt])
}
```

Prisma `String[]` requires Postgres — fine, Postgres is the only target.

## Related Code Files

**Create:**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_init/migration.sql` (generated)
- `src/lib/db.ts` — Prisma singleton (guard against hot-reload connection storms in dev):
  ```ts
  import { PrismaClient } from "@prisma/client";
  const g = globalThis as unknown as { prisma?: PrismaClient };
  export const db = g.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") g.prisma = db;
  ```
- `src/lib/fsrs-mapping.ts` — pure converters `Flashcard` row ⇄ ts-fsrs `Card` (snake_case ⇄ camelCase, enum int ⇄ Prisma enum). Keeps the naming mismatch in exactly one file. Used by Phase 06.

**Modify:**
- `package.json` — add `"db:migrate": "prisma migrate dev"`, `"db:generate": "prisma generate"`, `"db:studio": "prisma studio"`. **Do NOT add a `db:push` script** — its mere presence invites the forbidden command.

**Delete:** none.

## Implementation Steps

1. Provision a local Postgres for dev. Docker is not installed locally, so either use an existing local Postgres instance or a hosted dev DB. Confirm `psql "$DATABASE_URL" -c "select 1"` succeeds before touching Prisma.
2. `pnpm add -D prisma` and `pnpm add @prisma/client`.
3. `pnpm dlx prisma init --datasource-provider postgresql` (this may rewrite `.env` — check it did not clobber existing values; restore if so).
4. Write `prisma/schema.prisma` per the sketch above.
5. Generate the migration WITHOUT applying, so the SQL can be reviewed:
   `pnpm dlx prisma migrate dev --name init-lesson-and-flashcard-schema --create-only`
6. Read `prisma/migrations/*/migration.sql`. Confirm: cascade deletes present on all 4 lesson children + flashcard/reviewlog, unique index on `Lesson.videoId`, unique composite `(lessonId, orderIndex)` on each child, index on `Flashcard.due`.
7. Apply: `pnpm dlx prisma migrate dev`.
8. `pnpm dlx prisma generate`.
9. Write `src/lib/db.ts` and `src/lib/fsrs-mapping.ts`.
10. Sanity-seed by hand in `prisma studio` or a throwaway script: one lesson + 2 segments + 4 grammar points + 5 quiz questions + 2 vocab items. Confirm the single-query `include` read returns everything ordered correctly. Delete the lesson; confirm children vanish (cascade works).
11. `pnpm typecheck`. Commit: `feat: add prisma schema for lessons and fsrs flashcards`.

## Todo List
- [x] Reachable dev Postgres confirmed via `psql`
- [x] Install prisma + @prisma/client
- [x] `prisma init` (verify `.env` not clobbered)
- [x] Write `schema.prisma` (7 models, 3 enums)
- [x] `migrate dev --create-only`
- [x] Review generated SQL (cascades, uniques, `due` index)
- [x] Apply migration
- [x] `prisma generate`
- [x] `src/lib/db.ts` singleton
- [x] `src/lib/fsrs-mapping.ts` converters
- [x] Manual seed + single-query read + cascade-delete verification
- [x] `pnpm typecheck` green
- [x] Add db:migrate/db:generate/db:studio scripts (NO db:push)
- [x] Commit

## Success Criteria
- `prisma migrate status` reports the DB in sync with migration history, zero pending.
- One `findUnique` + `include` returns a complete lesson: segments in `orderIndex` order, 4 grammar points, 5 quiz questions, vocab items.
- Deleting a `Lesson` row leaves zero orphans in all 4 child tables (verify by count query).
- Inserting a second lesson with a duplicate `videoId` fails on the unique constraint.
- Every field of ts-fsrs `Card` has a corresponding `Flashcard` column.
- `git log` shows a `prisma/migrations/` dir committed. No `db push` in any script or command history.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Someone runs `prisma db push` out of habit | Med | **High** (desyncs prod from git history) | No `db:push` script in `package.json`; rule stated at top of this phase and in plan.md; migration dir committed so drift is visible |
| ts-fsrs 6.0 drops `elapsed_days` | Med | Low | Column stays (harmless); only `fsrs-mapping.ts` changes — one file, by design |
| Prisma enum ordinal ≠ ts-fsrs numeric enum | Med | Med | Never cast by ordinal. `fsrs-mapping.ts` maps by explicit name→value table; unit-test both directions (Phase 08) |
| `String[]` arity (4 examples / 3 options) not enforced by DB | High | Low | DB can't express it; enforce in Zod at the generation boundary (Phase 03) — reject before insert, so bad data never lands |
| `prisma init` overwrites the hand-written `.env` | Med | Med | Step 3 explicitly re-checks `.env` contents |
| No local Postgres available | Med | Med | Step 1 gates the phase; hosted dev DB is an acceptable substitute |

## Security Considerations
- `DATABASE_URL` holds credentials — read only via `lib/env.ts`, never logged. Scrub connection strings from any error surfaced to the UI.
- Single-user app, so no row-level tenancy needed (YAGNI) — but that means every authenticated request can read every lesson. Acceptable and intended; the gate is the shared password (Phase 07).
- Prisma parameterizes all queries; do not introduce `$queryRawUnsafe` anywhere in this project.
- `errorMessage` on `Lesson` may capture upstream API text. Do not store raw exception dumps that could echo the API key; truncate + sanitize before persisting (Phase 04).

## Next Steps
- Unblocks Phase 04 (ingest write path) and Phase 06 (flashcards).
- Phase 03 can proceed in parallel — it only needs the Zod shapes, not the DB.
