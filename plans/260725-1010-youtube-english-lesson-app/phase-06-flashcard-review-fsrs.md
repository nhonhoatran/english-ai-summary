# Phase 06 — Flashcard review with ts-fsrs

## Context Links
- Plan overview: [plan.md](./plan.md)
- Verified spec Part 3 (FSRS over SM-2): `plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md`
- ts-fsrs types read from: `https://unpkg.com/ts-fsrs@5.4.1/dist/index.d.ts`
- Blocked by: [Phase 02](./phase-02-postgres-prisma-schema-migration.md), [Phase 05](./phase-05-lesson-page-four-tabs-player-seek.md) (creates the saved cards)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Description:** One global review queue pooling vocab saved from ALL lessons, scheduled by FSRS. This is what converts "I looked the word up" into "I remember the word".

## Key Insights
- **FSRS via `ts-fsrs` v5.4.1** — settled. The researcher recommended SM-2 for simplicity; the verified spec overrode that and the reasoning holds: we use a library either way, so we never write the formula. The real delta is column count (trivial in Postgres) and `ts-fsrs` is by far the healthier dependency (25.9k downloads/mo, updated days before the research vs `supermemo`'s ~124/wk, 4 months stale).
- **Card fields are confirmed**, not guessed (read from the published types — this closes the spec's open question):
  ```ts
  interface Card { due: Date; stability: number; difficulty: number;
    elapsed_days: number /* deprecated, gone in 6.0 */; scheduled_days: number;
    learning_steps: number; reps: number; lapses: number;
    state: State; last_review?: Date }
  enum State  { New=0, Learning=1, Review=2, Relearning=3 }
  enum Rating { Manual=0, Again=1, Hard=2, Good=3, Easy=4 }
  ```
- API surface: `fsrs(params?) -> FSRS`, `createEmptyCard(now?)`, `f.repeat(card, now)` (preview all 4 grades), `f.next(card, now, grade)` → `RecordLogItem` = `{ card, log }`. Use **`next`** for "user pressed Good" — one grade, one result. `repeat` is for previewing all options, which we don't need (YAGNI).
- `Rating.Manual = 0` is NOT a user-pressable grade. The review UI exposes only **Again / Hard / Good / Easy** (1–4). Passing `Manual` to `next` is a misuse — the `Grade` type excludes it, so this is enforced at compile time if typed properly.
- **Naming mismatch is the main bug risk:** ts-fsrs uses `snake_case` (`scheduled_days`), Prisma uses `camelCase` (`scheduledDays`). Confine ALL conversion to `src/lib/fsrs-mapping.ts` (created in Phase 02). Never spread a DB row into `next()` and hope — the fields silently won't match and FSRS will compute from `undefined`.
- Same for enums: map by **explicit name→value table**, never by ordinal cast. Prisma enum ordering is not a contract.
- `ReviewLog` is append-only history. Not strictly required to schedule (state lives on `Flashcard`), but it is cheap and it is the only way to later re-optimize FSRS parameters or debug "why is this due tomorrow". Keep it; do NOT build a stats UI (not requested).

## Requirements

### Functional
- `/review` shows the count due and starts a session.
- Queue = all flashcards across all lessons where `due <= now`, ordered by `due` ascending.
- Card front = term. Reveal shows meaning + example + a link back to its source lesson.
- Four grade buttons: Again / Hard / Good / Easy → `f.next()` → persist updated card + append `ReviewLog`.
- Advance to next card; when the queue empties show a done state with the next due time.
- Empty state when nothing is due.
- Deleting a lesson removes its cards (cascade, Phase 02) without breaking an in-flight session.

### Non-functional
- Files < 200 lines.
- Grading is one server action per card — no batching, no optimistic-only state that can lose a grade.
- Queue query uses the `due` index from Phase 02.
- Default FSRS parameters. Do NOT expose tuning knobs (single user, no data to optimize on yet — YAGNI).

## Architecture

```
src/lib/fsrs/
  fsrs-instance.ts        # `export const scheduler = fsrs()` - default params, one instance
  create-initial-card.ts  # createEmptyCard() -> Prisma Flashcard create input
  grade-flashcard.ts      # row + grade -> { updatedCardData, reviewLogData }  (PURE)
src/lib/fsrs-mapping.ts   # (Phase 02) row <-> ts-fsrs Card; enum name tables
src/app/review/page.tsx   # SERVER: fetch due queue
src/components/review/
  review-session.tsx      # CLIENT: current index, reveal state, calls action
  review-card.tsx         # CLIENT: front/back presentation
  grade-buttons.tsx       # CLIENT: 4 buttons
src/app/actions/grade-flashcard-action.ts
```

### Grade flow
```
click "Good"
 └─ grade-flashcard-action(flashcardId, Rating.Good)
     └─ db.flashcard.findUnique
         └─ toFsrsCard(row)                    [fsrs-mapping: camel->snake, enum]
             └─ scheduler.next(card, new Date(), grade) -> { card, log }
                 └─ $transaction:
                      flashcard.update(fromFsrsCard(card))
                      reviewLog.create(fromFsrsLog(log))
                     └─ return { nextDue }
```

`grade-flashcard.ts` is deliberately **pure** (row + grade + now → new values) so Phase 08 can unit-test the scheduling wiring without a database. The action is the thin impure shell around it.

### Session state
Queue is fetched once on page load and held in the Client Component; grading advances a local index. Re-fetching after every grade would be wasteful and could re-serve a just-graded card (learning-step cards can become due again within minutes). Cards that come due mid-session are picked up on the next visit — acceptable and simpler.

## Related Code Files

**Create:**
- `src/lib/fsrs/fsrs-instance.ts`
- `src/lib/fsrs/create-initial-card.ts`
- `src/lib/fsrs/grade-flashcard.ts`
- `src/app/review/page.tsx`
- `src/components/review/review-session.tsx`
- `src/components/review/review-card.tsx`
- `src/components/review/grade-buttons.tsx`
- `src/app/actions/grade-flashcard-action.ts`

**Modify:**
- `package.json` — `pnpm add ts-fsrs@5.4.1`
- `src/lib/fsrs-mapping.ts` — fill in the converters stubbed in Phase 02
- `src/app/actions/save-vocab-to-deck-action.ts` (Phase 05) — refactor to use `create-initial-card.ts`
- `src/app/page.tsx` or root layout — nav link to `/review` with due count

**Delete:** none.

## Implementation Steps

1. `pnpm add ts-fsrs@5.4.1`. Note it requires Node ≥20 — we have 24.15.0.
2. Write `fsrs-mapping.ts` in full:
   - `toFsrsCard(row): Card` — camel→snake, `FsrsState`→`State` via an explicit `Record<FsrsState, State>`.
   - `fromFsrsCard(card): Prisma.FlashcardUpdateInput` — reverse.
   - `fromFsrsLog(log): Prisma.ReviewLogCreateInput` — note `log.review` maps to column `reviewedAt`.
   - Include `elapsed_days`/`elapsedDays` (still live in v5).
3. `fsrs-instance.ts`: `export const scheduler = fsrs();` — default params, module-level singleton.
4. `create-initial-card.ts`: wrap `createEmptyCard(new Date())` → Prisma create input via `fromFsrsCard`. Refactor Phase 05's save action to call this so initial state has exactly one definition.
5. `grade-flashcard.ts`: pure function `(row, grade, now) => { card, log }` using `scheduler.next`. Type `grade` as ts-fsrs `Grade` so `Rating.Manual` cannot be passed.
6. `grade-flashcard-action.ts`: `"use server"`, load row → pure function → `$transaction` update + log create → return next due. 404-safe if the card was deleted mid-session (lesson deleted) — return a benign result and let the UI skip it rather than throwing.
7. `review/page.tsx`: `db.flashcard.findMany({ where: { due: { lte: new Date() } }, orderBy: { due: "asc" }, include: { vocabItem: { include: { lesson: { select: { id: true, title: true } } } } } })`. Empty state if none.
8. `review-session.tsx`: index + revealed state; on grade call the action inside `useTransition`, then advance. Done screen shows soonest upcoming due date.
9. `review-card.tsx`: term large; revealed side shows meaning, example, and a link to `/lessons/{id}` (closing the loop back to the source video — this is what makes review contextual).
10. `grade-buttons.tsx`: 4 buttons, keyboard shortcuts 1–4. Disable while pending so a double-press can't double-grade.
11. Add due-count nav link.
12. Manual test: save 3 words from 2 different lessons → `/review` shows 3 → grade Again on one and Good on another → verify in `prisma studio` that `due`, `reps`, `state`, `stability`, `difficulty` all changed sensibly (Again should schedule sooner than Good, and set state Learning/Relearning) and that a `ReviewLog` row was appended per grade.
13. `pnpm typecheck` + `pnpm build`. Commit: `feat: add fsrs flashcard review`.

## Todo List
- [ ] `pnpm add ts-fsrs@5.4.1`
- [ ] `fsrs-mapping.ts` both directions + explicit enum tables
- [ ] `fsrs-instance.ts`
- [ ] `create-initial-card.ts` + refactor Phase 05 save action to use it
- [ ] `grade-flashcard.ts` (pure, `Grade`-typed)
- [ ] `grade-flashcard-action.ts` transactional + delete-safe
- [ ] `review/page.tsx` due queue + empty state
- [ ] `review-session.tsx`
- [ ] `review-card.tsx` with back-link to lesson
- [ ] `grade-buttons.tsx` + shortcuts + pending disable
- [ ] Nav link with due count
- [ ] Manual test: Again vs Good produce different, sensible schedules
- [ ] Verify a `ReviewLog` row per grade
- [ ] `pnpm typecheck` + `pnpm build` green
- [ ] Commit

## Success Criteria
- Cards saved from two different lessons appear in one shared queue.
- Grading persists: `due`, `reps`, `state`, `stability`, `difficulty`, `lastReview` all update; `ReviewLog` gains exactly one row per grade.
- `Again` yields a nearer `due` than `Good`, which is nearer than `Easy` (sanity of the mapping — if these come out identical, the snake/camel conversion is broken).
- A just-graded card no longer appears on a fresh `/review` load (unless a learning step legitimately re-dues it).
- Empty queue → clean done/empty state, no crash.
- Deleting a lesson mid-session does not 500 the grade action.
- All files < 200 lines.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **snake_case/camelCase mismatch silently feeds `undefined` to FSRS** | **High** | **High** (all scheduling wrong, looks plausible) | All conversion in one mapping file; the Again<Good<Easy ordering check at step 12 is the detector; unit-tested round-trip in Phase 08 |
| Enum mapped by ordinal instead of name | Med | **High** | Explicit `Record` name→value tables; never numeric casts |
| `Rating.Manual` passed as a grade | Low | Med | Type as ts-fsrs `Grade` (excludes Manual) — compile-time block |
| Double-grade from double-click | Med | Med | Disable buttons while pending |
| ts-fsrs 6.0 drops `elapsed_days` | Med | Low | Confined to the mapping file by design; column can stay |
| Stale queue during long session | Med | Low | Accepted; picked up next visit. No polling (YAGNI) |
| Card deleted mid-session (lesson deleted) | Low | Low | Action returns benign result; UI skips |

## Security Considerations
- `/review` and the grade action sit behind the shared password (Phase 07).
- Validate `flashcardId` exists before update; never trust a client-supplied id to be current.
- Validate the grade is one of 1–4 server-side (a client could post 0 or 99); reject otherwise. Type safety does not survive the network boundary.
- No PII involved; review history is the user's own study data.

## Next Steps
- Phase 07 gates these routes; Phase 08 unit-tests the mapping round-trip and the pure grade function.
