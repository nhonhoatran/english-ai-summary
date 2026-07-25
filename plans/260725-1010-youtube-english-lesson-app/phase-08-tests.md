# Phase 08 — Tests

## Context Links
- Plan overview: [plan.md](./plan.md)
- Blocked by: Phases 01–07 (tests target the shipped code)
- Project rule: never ignore failing tests to make a build pass

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Description:** Test where tests actually pay: pure logic with real failure modes (URL parsing, timestamp formatting, FSRS field mapping, Zod arity contracts) plus a small integration pass on ingest and auth. Deliberately thin on UI.

## Key Insights
- **Test the silent-failure paths, not the loud ones.** Ranked by "wrong but looks fine":
  1. `fsrs-mapping` snake/camel round-trip — a mismatch feeds `undefined` into FSRS and produces plausible-looking but wrong schedules. Highest-value test in the project.
  2. `parse-youtube-url` — many URL shapes, one of which (playlist) must be rejected.
  3. Zod arity contracts (4x4 grammar, 5x3 quiz) — the DB cannot enforce these, so Zod is the only guard; test that it actually rejects.
  4. `format-timestamp` — trivial but has classic boundary bugs (59→60s, 0, >1h).
- **Do not mock the database for the ingest integration test.** Project/user rule: mocked DB tests pass while real migrations break. Use a real throwaway Postgres schema/database.
- **Do mock Gemini.** It is slow, costs money per run, and is non-deterministic — no assertion about generated *content* can be stable. Test that ingest correctly persists a *fixed* generator output, and separately that caption-failure routes to the video path. The generator's output *quality* is verified by human review (Phase 03 step 10), not by unit tests. Being explicit: quality of LLM output is not unit-testable, and pretending otherwise produces flaky tests that get ignored.
- **No E2E browser tests.** Single-user app; Playwright infra cost exceeds its value here (YAGNI). The manual test matrices in Phases 04–07 cover the interactive paths.
- Vitest over Jest: native ESM + TS, no transform config, and it is the current default in the Next.js ecosystem.

## Requirements

### Functional
- `pnpm test` runs the suite; non-zero exit on any failure.
- Unit coverage of: `parse-youtube-url`, `format-timestamp`, `fsrs-mapping` (both directions), `grade-flashcard` (pure), `lesson-schemas` (Zod accept/reject), `auth-cookie` (sign/verify/forge-rejection).
- Integration: ingest persists a complete lesson with a stubbed generator; duplicate URL does not re-generate; caption failure routes to the video path.
- Integration: middleware/`requireAuth` rejects unauthenticated action calls.

### Non-functional
- Suite runs in well under a minute; zero network calls.
- No real Gemini calls in any test (a test run must never cost money).
- Test files mirror source paths, `*.test.ts`.
- Tests must be deterministic — inject `now` rather than reading the clock in assertions.

## Architecture

```
vitest.config.ts
src/lib/ingest/parse-youtube-url.test.ts
src/lib/format-timestamp.test.ts
src/lib/fsrs-mapping.test.ts
src/lib/fsrs/grade-flashcard.test.ts
src/lib/gemini/lesson-schemas.test.ts
src/lib/auth/auth-cookie.test.ts
tests/integration/ingest-lesson.test.ts        # real DB, stubbed generator
tests/integration/auth-guard.test.ts
tests/fixtures/generated-lesson-fixture.ts     # one valid GeneratedLesson
tests/fixtures/caption-segments-fixture.ts
tests/helpers/reset-test-database.ts
```

Boundary: pure functions get unit tests with no setup. Ingest gets a real DB and a stubbed generator — the seam is `generateLesson`, which is exactly why Phase 03 made it the single exported entry point. Testability was a side benefit of that abstraction; state it so nobody "simplifies" the seam away.

## Test matrix

| Target | Cases |
|---|---|
| `parse-youtube-url` | `youtube.com/watch?v=ID`; `youtu.be/ID`; `m.youtube.com`; `/shorts/ID`; extra query params; `v=` **and** `list=` → uses `v=`; playlist-only (`list=`, no `v=`) → reject; non-YouTube host → reject; 10-char and 12-char ids → reject; empty string → reject |
| `format-timestamp` | 0 → `0:00`; 5 → `0:05`; 59 → `0:59`; 60 → `1:00`; 61 → `1:01`; 599 → `9:59`; 3600 → `1:00:00`; 3661 → `1:01:01` |
| `fsrs-mapping` | `toFsrsCard` → every `Card` field defined, none `undefined` (guards the whole class of naming bugs); `fromFsrsCard(toFsrsCard(row))` deep-equals `row`; all 4 `State` values map both ways by name; all 5 `Rating` values map both ways; `lastReview` null ⇄ `last_review` undefined |
| `grade-flashcard` | fixed card + fixed `now`: Again/Hard/Good/Easy each produce a `due` strictly after `now`; **`due(Again) < due(Good) < due(Easy)`**; `reps` increments; Again on a Review-state card sets `Relearning`; returns a log whose `rating` matches the input |
| `lesson-schemas` | valid fixture parses; 3 grammar points → reject; 5 examples in a point → reject; 4 quiz questions → reject; 2 options → reject; `correctIndex: 3` → reject; 5 vocab items → reject; 11 → reject; negative `startSeconds` → reject; empty string fields → reject |
| `auth-cookie` | signed value verifies; tampered payload → reject; wrong-secret signature → reject; garbage string → reject; empty → reject |
| ingest (integration) | fresh URL + stub generator → lesson READY with 1+ segments, exactly 4 grammar points, 5 questions, 6–10 vocab, correct `orderIndex` ordering; `transcriptSource="youtube-captions"` when captions stub returns segments; `="gemini"` when it returns null; **same URL twice → one row, generator called exactly once**; generator throws → status FAILED + sanitized message + retry possible; invalid URL → no generator call at all |
| auth guard (integration) | server action without cookie → rejected; with forged cookie → rejected; with valid cookie → proceeds |

The `due(Again) < due(Good) < due(Easy)` assertion is the canary for the mapping bug — if conversion is broken, these collapse to equal values.

## Related Code Files

**Create:** all files in the layout above.

**Modify:**
- `package.json` — `pnpm add -D vitest @vitejs/plugin-react`; scripts `"test": "vitest run"`, `"test:watch": "vitest"`
- `.env.example` — document `TEST_DATABASE_URL`
- `src/lib/env.ts` — optional `TEST_DATABASE_URL`

**Delete:** none.

## Implementation Steps

1. `pnpm add -D vitest @vitejs/plugin-react`. Add `vitest.config.ts` with path alias `@/*` matching `tsconfig.json` (mismatched aliases are the usual first-run failure).
2. Add `test` / `test:watch` scripts.
3. Write the 6 unit test files per the matrix. Start with `fsrs-mapping.test.ts` — highest value.
4. Write `tests/fixtures/generated-lesson-fixture.ts`: one valid `GeneratedLesson` (4 grammar points x 4 examples, 5 questions x 3 options, 6 vocab). Reuse it in both schema and ingest tests — single fixture, no drift (DRY).
5. Set up the integration DB: `TEST_DATABASE_URL` pointing at a separate database. `reset-test-database.ts` truncates all tables between tests (cascade order or `TRUNCATE ... CASCADE`). Apply schema with `prisma migrate deploy` against the test DB — **not `db push`**, same hard rule; this also verifies migrations actually apply cleanly, which is the point of not mocking.
6. Write `ingest-lesson.test.ts`, injecting stubs for `generateLesson` and `fetchYoutubeCaptions`. If the current implementation imports them as hard module references, use `vi.mock`; prefer refactoring `ingest-lesson.ts` to accept them as optional injected deps — cleaner and it keeps the test honest about the real seam.
7. Write `auth-guard.test.ts` around `requireAuth` with crafted cookie headers.
8. Run `pnpm test`. Fix real bugs found — **do not weaken an assertion to get green**. If a test fails, either the code is wrong or the expectation was wrong; decide which, and record briefly if the expectation changed.
9. Add a `docs/testing.md` note on running the suite + provisioning the test DB (or fold into README).
10. `pnpm typecheck` + `pnpm test` + `pnpm build` all green. Commit: `test: add unit and integration test suite`.

## Todo List
- [ ] Install vitest, `vitest.config.ts` with matching path alias
- [ ] `test` / `test:watch` scripts
- [ ] `fsrs-mapping.test.ts` (do first)
- [ ] `parse-youtube-url.test.ts`
- [ ] `format-timestamp.test.ts`
- [ ] `grade-flashcard.test.ts` incl. Again<Good<Easy
- [ ] `lesson-schemas.test.ts` arity rejections
- [ ] `auth-cookie.test.ts` incl. tamper rejection
- [ ] Fixtures (single shared `GeneratedLesson`)
- [ ] Test DB via `migrate deploy` + reset helper
- [ ] `ingest-lesson.test.ts` (real DB, stubbed generator)
- [ ] `auth-guard.test.ts`
- [ ] All tests pass with no weakened assertions
- [ ] `docs/testing.md`
- [ ] `pnpm typecheck` + `test` + `build` green
- [ ] Commit

## Success Criteria
- `pnpm test` exits 0 with every matrix case implemented.
- Zero network calls, zero Gemini spend during a run (verify by running with an invalid `GEMINI_API_KEY` — the suite must still pass).
- `fsrs-mapping` round-trip proves no field is dropped; `due(Again) < due(Good) < due(Easy)` holds.
- Zod rejects every wrong-arity case (proves the DB's unenforceable constraints are actually guarded).
- Ingest integration runs against a real migrated Postgres, and duplicate-URL calls the generator exactly once.
- No `db push` in test setup.
- All test files < 200 lines.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Temptation to mock the DB for speed | Med | **High** (mock/prod divergence hides migration breakage) | Explicit rule; real throwaway DB; `migrate deploy` in setup doubles as migration verification |
| A test accidentally hits real Gemini | Med | Med (costs money, flaky) | Stub at the `generateLesson` seam; verify suite passes with an invalid key |
| Asserting on LLM content → permanent flakiness | Med | Med | Explicitly out of scope; content quality is human-reviewed in Phase 03 |
| Test DB pollution between tests | Med | Med | Truncate-cascade helper before each integration test |
| Vitest alias mismatch with tsconfig | **High** (first run) | Low | Configured at step 1 |
| Clock-dependent flakiness in FSRS tests | Med | Med | Inject a fixed `now`; never assert against `new Date()` |
| Tests weakened to force a green build | Med | **High** | Stated prohibition; a changed expectation must be justified in the commit |

## Security Considerations
- Test DB credentials in `.env.test` / `TEST_DATABASE_URL` — gitignored, never committed.
- Never use the production `DATABASE_URL` for tests — the reset helper truncates tables. A misconfigured `TEST_DATABASE_URL` would delete real lessons. Add a guard in `reset-test-database.ts`: refuse to run if the URL equals `DATABASE_URL` or lacks a `test` marker in the database name. Cheap insurance against an irreversible mistake.
- Use a dummy `APP_PASSWORD` / `AUTH_SECRET` in tests; never the real ones.
- Fixtures must contain no real API keys.

## Next Steps
- Final: full manual end-to-end on the VPS (paste a real video → review it → save a word → grade it).
- Optional follow-up, only if the caption package breaks in practice: a smoke test asserting captions still fetch for a known video. Deliberately excluded now — it is a network test and would be flaky by nature.
