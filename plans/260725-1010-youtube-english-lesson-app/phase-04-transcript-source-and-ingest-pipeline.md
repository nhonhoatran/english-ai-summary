# Phase 04 — YouTube caption fetch (Gemini fallback) + ingest pipeline

## Context Links
- Plan overview: [plan.md](./plan.md)
- Verified spec: `plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md`
- Blocked by: [Phase 02](./phase-02-postgres-prisma-schema-migration.md) (write target), [Phase 03](./phase-03-gemini-integration-probe-and-prompts.md) (`generateLesson`)
- Blocks: [Phase 05](./phase-05-lesson-page-four-tabs-player-seek.md)

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 3h
- **Description:** The write path. Paste one YouTube URL → resolve a transcript (captions first, Gemini fallback) → generate the lesson → persist atomically. After this phase the app has data; Phase 05 only reads it.

## Key Insights
- **This is the ONLY place AI runs.** Architectural invariant of the whole app: ingest is the one-time cost, review is free forever. Any later code path that calls `generateLesson` outside ingest is a bug.
- **Two transcript sources, ranked:**
  1. YouTube's own captions via `@danielxceron/youtube-transcript` (v1.2.6 verified on npm) — cheap (zero video tokens), and timings are **exact** rather than model-estimated. Preferred whenever available.
  2. Gemini video transcription — works on anything with speech, but costs ~100–300 tokens/sec and has reported ±1–2s timestamp drift.
- **Caption packages use unofficial/reverse-engineered YouTube APIs and WILL break eventually** (no SLA; the ecosystem is littered with abandoned forks). The Gemini fallback is the mitigation and it must be exercised, not just written — test it by forcing the fallback path.
- Captions come back as `{ text, offset, duration }` with **offset in milliseconds**. Convert to `startSeconds` (int) — do not store ms; Phase 02's column is seconds and the player seeks in seconds.
- Raw auto-captions have **no speaker labels** and are chopped into ~2-second fragments, not speaker turns. They are not directly usable as an elllo Script tab. So the caption path still needs the analysis call to group fragments into speaker turns — that call is text-only (cheap). Do not assume captions alone give a finished transcript.
- **Idempotency by `videoId`.** `Lesson.videoId` is unique (Phase 02). Re-pasting a URL already ingested must open the existing lesson, not burn tokens regenerating. This directly serves the user's core need (instant re-review).
- Latency: measured in Phase 03 step 2. A 20-min video may take minutes. VPS deploy means no serverless timeout, so a straightforward blocking request is acceptable (KISS) — but the UI needs honest feedback. Use `status` on the row (`PENDING`/`GENERATING`/`READY`/`FAILED`), so a page reload after a browser close still shows truth.

## Requirements

### Functional
- Accept a single YouTube URL (watch, `youtu.be`, and `?v=` with extra params all parse).
- Reject non-YouTube / malformed input before any paid call.
- If `videoId` already exists with status `READY`, redirect to the existing lesson; do not regenerate.
- Try captions; on absence/failure fall back to Gemini video transcription, recording which source was used in `Lesson.transcriptSource`.
- Persist the complete lesson in one transaction; a lesson is never half-written.
- On failure, persist `status=FAILED` + a sanitized `errorMessage`, and allow retry.
- **NO playlist support** (explicitly cut). A playlist URL is rejected with a clear message.

### Non-functional
- Files < 200 lines; the pipeline splits into url-parse / caption-fetch / orchestrator.
- No rate limiting, no quota metering, no usage dashboard (explicitly waived by user — YAGNI).
- Server-only. The URL never reaches Gemini from the browser.

## Architecture

### Module layout
```
src/lib/ingest/
  parse-youtube-url.ts        # URL -> videoId | error; rejects playlists
  fetch-youtube-captions.ts   # captions -> CaptionSegment[] | null (never throws)
  ingest-lesson.ts            # orchestrator: the one AI entry point
src/app/actions/
  ingest-lesson-action.ts     # server action called by the UI form
```

### Flow
```
URL string
 └─ parse-youtube-url            -> videoId  (reject playlist / malformed)
     └─ db.lesson.findUnique({videoId})
         ├─ exists & READY -> return { lessonId, reused: true }   [ZERO tokens]
         └─ else
             └─ create/update Lesson { status: GENERATING }
                 └─ fetch-youtube-captions(videoId)
                     ├─ segments  -> generateLesson({kind:"with-captions", ...})  [text-only, cheap]
                     └─ null      -> generateLesson({kind:"video-only", ...})     [video tokens]
                         └─ Zod-valid GeneratedLesson
                             └─ $transaction: nested-create children,
                                              set transcriptSource, status=READY
                                 └─ { lessonId, reused: false }
   any throw -> status=FAILED + sanitized errorMessage (row survives for retry)
```

Note the caller of `generateLesson` picks only the *input kind*, never the strategy — the 1-call vs 2-call question from Phase 03 is invisible here. That is the abstraction working.

### `parse-youtube-url` contract
Accept: `youtube.com/watch?v=ID`, `youtu.be/ID`, `m.youtube.com/watch?v=ID`, `youtube.com/shorts/ID`, extra query params tolerated.
Reject with distinct messages: playlist URLs (`list=` present and no `v=`), non-YouTube hosts, malformed ids (must be 11 chars `[A-Za-z0-9_-]`).
A URL with BOTH `v=` and `list=` → treat as the single video (`v=`), ignore `list=`. Reasonable reading: user pasted a video that happens to sit in a playlist.

### Error taxonomy (all surfaced as short, safe messages)
| Cause | User-facing message |
|---|---|
| malformed / non-YouTube | "That doesn't look like a YouTube video link." |
| playlist-only URL | "Playlists aren't supported — paste a single video link." |
| private/unlisted (Gemini rejects; verified) | "This video is private or unlisted, so it can't be processed." |
| captions absent | (silent — falls back, not an error) |
| Gemini failure / invalid output | "Couldn't generate the lesson. Try again." |

## Related Code Files

**Create:**
- `src/lib/ingest/parse-youtube-url.ts`
- `src/lib/ingest/fetch-youtube-captions.ts`
- `src/lib/ingest/ingest-lesson.ts`
- `src/app/actions/ingest-lesson-action.ts`
- `src/components/add-lesson-form.tsx` — URL input + submit + pending state (shadcn Input/Button)

**Modify:**
- `package.json` — `pnpm add @danielxceron/youtube-transcript@1.2.6`
- `src/app/page.tsx` — mount the add-lesson form (full home list is Phase 05)

**Delete:** none.

## Implementation Steps

1. `pnpm add @danielxceron/youtube-transcript@1.2.6`.
2. Write `parse-youtube-url.ts` as a pure function returning a discriminated result (`{ok:true,videoId}` | `{ok:false,reason}`). Pure = unit-testable without network (Phase 08).
3. Write `fetch-youtube-captions.ts`:
   - Call `YoutubeTranscript.fetchTranscript({ videoId })`.
   - Map `{ text, offset, duration }` → `{ startSeconds: Math.floor(offset / 1000), text }`.
   - **Verify the offset unit empirically** on a real video before trusting it — check that the last segment's offset/1000 is near the video's known duration. If the package returns seconds rather than ms, the naive `/1000` silently produces an all-zeros transcript.
   - Wrap in try/catch and return `null` on ANY failure (no captions, package broken, network). Never throw — absence is a normal, expected branch, not an error.
   - Log which branch was taken so a silently-degraded caption package is noticeable.
4. Write `ingest-lesson.ts` per the flow above. Keep it thin: parse → dedupe-check → transcript → generate → persist. Under 200 lines; if it grows, extract the persist step into `persist-lesson.ts`.
5. Persist with a nested create inside `$transaction`, assigning `orderIndex` from array position (1-based for grammar/quiz to match "Point 1"/"Q1" display, 0-based for segments — pick one convention and state it in a comment; mismatched conventions here cause off-by-one display bugs later).
6. Write the server action: validate input, call `ingest-lesson`, `revalidatePath("/")`, return `{ lessonId }` or `{ error }`. Mark `"use server"`.
7. Write `add-lesson-form.tsx`: single Input + Button, `useTransition` for pending state, show the error message, redirect to `/lessons/[id]` on success. Given measured latency may be minutes, show an honest pending message ("Generating your lesson — this can take a few minutes for a long video") rather than a bare spinner.
8. Manual test matrix:
   - video WITH captions → `transcriptSource = "youtube-captions"`, correct timings
   - video WITHOUT captions → falls back, `transcriptSource = "gemini"`
   - **forced fallback**: temporarily stub `fetch-youtube-captions` to return `null` on a captioned video, confirm the Gemini path produces a good lesson (this is the mitigation for the package-breakage risk — it must be proven to work now, not discovered broken later)
   - re-paste an ingested URL → instant, zero tokens, opens existing lesson
   - playlist URL → rejected with the playlist message
   - garbage string → rejected before any API call (confirm via absence of token spend/logs)
   - private video → clear message, row ends `FAILED`
9. `pnpm typecheck`. Commit: `feat: add lesson ingest pipeline with caption fetch and gemini fallback`.

## Todo List
- [x] `pnpm add @danielxceron/youtube-transcript@1.2.6`
- [x] `parse-youtube-url.ts` (pure, rejects playlists)
- [x] `fetch-youtube-captions.ts` (returns null, never throws)
- [x] **Empirically verify caption offset unit is ms**
- [x] `ingest-lesson.ts` orchestrator
- [x] Atomic `$transaction` persist with explicit orderIndex convention
- [x] `ingest-lesson-action.ts` server action
- [x] `add-lesson-form.tsx` with honest long-running pending state
- [x] Test: captioned video
- [x] Test: uncaptioned video
- [x] **Test: forced caption failure → Gemini fallback works**
- [x] Test: duplicate URL → zero tokens
- [x] Test: playlist rejected
- [x] Test: garbage rejected pre-API
- [x] Test: private video → FAILED + clear message
- [x] `pnpm typecheck` green
- [x] Commit

## Success Criteria
- Pasting a fresh YouTube URL produces a `READY` lesson row with: ≥1 segment, exactly 4 grammar points, exactly 5 quiz questions, 6–10 vocab items.
- `transcriptSource` accurately reflects which path ran, on both paths.
- Caption-path `startSeconds` values are correct (spot-check 3 segments against the real video by ear).
- Re-pasting the same URL completes near-instantly and creates no second row.
- A forced caption failure still yields a complete lesson via Gemini.
- Interrupting mid-generation leaves the row `GENERATING`/`FAILED` — never a half-populated `READY` lesson.
- No AI call occurs on the duplicate-URL path (verify by log absence).

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Caption package breaks (unofficial API, no SLA)** | **High** (eventually) | Med | Gemini fallback, proven by the forced-failure test at step 8. `null`-on-any-error means breakage degrades cost, not function. Version pinned so it can't break via silent update |
| Caption offset unit assumed wrong (ms vs s) | Med | **High** (all timestamps zero / 1000x off — seek feature silently useless) | Explicit empirical check, step 3 |
| Auto-captions have no speaker labels | **High** (certain) | Med | Expected: analysis call groups fragments into speaker turns. Do not ship the raw caption fragments as the Script tab |
| Partial write on crash mid-persist | Low | **High** | Single `$transaction`; `status` field means a crashed ingest is visibly incomplete, not silently broken |
| Long generation, user closes tab | Med | Low | Status persisted in DB; reopening shows real state. No websockets (YAGNI) |
| Duplicate ingest burns tokens | Med | Med | Unique `videoId` + explicit pre-check before any AI call |
| orderIndex convention mismatch (0- vs 1-based) | Med | Low | One convention, stated in a comment at the persist site |
| Gemini transcript timestamps drift ±1–2s | Med | Low | Acceptable for review-seeking; captions path avoids it entirely |

## Security Considerations
- Everything server-side: URL parsing, caption fetch, Gemini call, DB write. The API key never crosses to the client.
- Validate the URL BEFORE spending money — cheapest possible guard against a typo triggering a paid video call.
- Sanitize before persisting `errorMessage`: truncate, strip anything resembling a key or full request payload. This column is rendered to the user, so treat it as untrusted output.
- The server action must sit behind the Phase 07 password gate; until Phase 07 lands, do not expose the app beyond localhost — an open ingest endpoint is an open invitation to spend the user's API budget.
- No SSRF concern of substance: only YouTube URLs are forwarded, and only to Gemini — but the strict 11-char id validation is what keeps it that way. Do not relax it to "any string containing youtube.com".

## Next Steps
- Unblocks Phase 05 (data now exists to render).
- Phase 07 must gate this action; note the dependency there.
