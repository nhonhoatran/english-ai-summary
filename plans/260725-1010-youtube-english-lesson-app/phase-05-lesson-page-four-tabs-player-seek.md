# Phase 05 — Lesson UI: 4 tabs + YouTube player seek-on-click + home list

## Context Links
- Plan overview: [plan.md](./plan.md)
- Verified elllo format: `plans\reports\verified-260725-1002-elllo-format-and-gemini-api.md` (Part 1)
- Reference page: https://elllo.org/english/grammar/L2-03-MegTodd-Sandwich.htm
- Blocked by: [Phase 02](./phase-02-postgres-prisma-schema-migration.md), [Phase 04](./phase-04-transcript-source-and-ingest-pipeline.md)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Description:** The read path — the screen the user actually came for. Home list of all lessons + lesson page with 4 tabs (Script, Grammar, Quiz, Vocabulary). Clicking a transcript line seeks the embedded player. **Zero AI calls.**

## Key Insights
- **DB-only render is the product.** The user's whole problem was "to review I must re-watch from the start". This page must load instantly from Postgres. If a spinner-worthy delay appears here, the feature has failed. One `findUnique` + `include`.
- elllo has 3 tabs; we add a 4th (Vocabulary) — verified: elllo has no vocab tab, so it is our own design with no template to copy. Free rein, but keep it plain.
- **Timestamps are our addition too.** Verified: elllo's Script has NO timestamps. The user explicitly asked for click-to-seek, so we deviate deliberately — show `MM:SS` per turn and make it clickable.
- Script format: `**Speaker**: text`, one block per turn, short backchannel turns kept verbatim ("Yum.", "Mm-hmm."). Do not filter short lines out of the render — faithfulness is the verified elllo behavior and it is what makes the transcript trustworthy for review.
- Player seek needs the **YouTube IFrame Player API** (`player.seekTo(seconds, true)`), not a plain `<iframe src>`. A bare iframe cannot be controlled. Use `react-youtube` (thin wrapper, gives an `onReady` player ref) or load the IFrame API by hand. Prefer `react-youtube` — hand-rolling the global `onYouTubeIframeAPIReady` callback in React is fiddly and this is the KISS choice.
- Player instance must live in a **Client Component** holding a ref, with transcript lines as children calling a `seekTo` callback. Server Component fetches, Client Component handles interaction. Keep the boundary tight: only the player + tabs are client-side.
- Quiz behavior is verified from elllo: `Check Answers` / `Reset Quiz` / `Show Answers`. Answers are checked **client-side only** — the correct index is already in the payload. No server round-trip, no attempt-persistence (YAGNI: quiz score history was never requested).
- Vocab "save to deck" is the one write on this page — a server action creating a `Flashcard` (Phase 06 owns the FSRS init). Show saved-state so the user knows.

## Requirements

### Functional
- `/` lists all lessons (title, description, date, thumbnail), newest first, each opening its lesson page. Includes the add-lesson form from Phase 04. Shows non-READY lessons with their status.
- `/lessons/[id]` renders header (title, 1-line description, embedded player) + 4 tabs.
- **Script tab:** one block per turn, `MM:SS` + bold speaker + text. Clicking a line seeks the player to `startSeconds` and it keeps playing.
- **Grammar tab:** `grammarTheme` heading, then "Point 1..4" each with its one-sentence explanation and a bulleted list of its 4 examples.
- **Quiz tab:** 5 gap-fill questions, 3 selectable options each. Check Answers marks right/wrong; Reset clears; Show Answers reveals correct options.
- **Vocabulary tab:** term / meaning / example per item + a Save-to-deck button reflecting saved state.
- Deep-linkable tabs (URL hash or search param) so a tab survives reload — elllo does this with `#view1/2/3`.

### Non-functional
- Lesson page: ONE database query. No AI. No N+1.
- Every component file < 200 lines — this phase has the most UI, so split per tab.
- Server Components by default; `"use client"` only where interaction demands it.
- Readable on mobile (user reviews vocab on a phone plausibly) — tabs and player must not overflow.

## Architecture

### Route + component layout
```
src/app/
  page.tsx                          # SERVER: home, lesson list + add form
  lessons/[id]/page.tsx             # SERVER: the ONE query, passes data down
src/components/lesson/
  lesson-player-provider.tsx        # CLIENT: react-youtube + seekTo via context
  lesson-tabs.tsx                   # CLIENT: shadcn Tabs shell, hash sync
  tab-script.tsx                    # CLIENT: clickable turns (needs seekTo)
  tab-grammar.tsx                   # SERVER-safe: pure presentational
  tab-quiz.tsx                      # CLIENT: selection + check/reset/show state
  tab-vocabulary.tsx                # CLIENT: save-to-deck action calls
  lesson-list-card.tsx              # SERVER-safe: one row on home
src/lib/format-timestamp.ts         # seconds -> "MM:SS" (and H:MM:SS if >1h)
src/app/actions/save-vocab-to-deck-action.ts
```

### Data flow
```
/lessons/[id]  (Server Component)
  └─ db.lesson.findUnique({ where:{id}, include:{
       segments:      { orderBy: { orderIndex: "asc" } },
       grammarPoints: { orderBy: { orderIndex: "asc" } },
       quizQuestions: { orderBy: { orderIndex: "asc" } },
       vocabItems:    { orderBy: { orderIndex: "asc" }, include: { flashcard: true } },
     }})                                     <-- ONE query, ZERO AI
     └─ <LessonPlayerProvider videoId>       CLIENT, owns player ref
          └─ <LessonTabs>
               ├─ <TabScript segments>        onClick -> seekTo(startSeconds)
               ├─ <TabGrammar theme points>
               ├─ <TabQuiz questions>         local state only
               └─ <TabVocabulary items>       -> save-vocab-to-deck-action
```

`vocabItems.include.flashcard` is how the UI knows a word is already saved — that is why Phase 02 modelled `Flashcard` as an optional relation on `VocabItem`.

### Seek mechanism
`LessonPlayerProvider` holds the `YouTubePlayer` instance from `react-youtube`'s `onReady`, and exposes `seekTo(sec)` through React context. `TabScript` consumes the context. Context (not prop-drilling) because the player and the script sit in different subtrees under the tabs shell.

Guard: `seekTo` must no-op if the player isn't ready yet (user clicks a line before the iframe loads) — otherwise it throws on undefined.

### Quiz state machine
```
idle --select--> answered(selections) --Check--> checked(show correctness)
                                     --Show---> revealed(show correct answers)
checked|revealed --Reset--> idle
```
All local `useState`. Nothing persisted.

## Related Code Files

**Create:**
- `src/app/lessons/[id]/page.tsx`
- `src/components/lesson/lesson-player-provider.tsx`
- `src/components/lesson/lesson-tabs.tsx`
- `src/components/lesson/tab-script.tsx`
- `src/components/lesson/tab-grammar.tsx`
- `src/components/lesson/tab-quiz.tsx`
- `src/components/lesson/tab-vocabulary.tsx`
- `src/components/lesson/lesson-list-card.tsx`
- `src/lib/format-timestamp.ts`
- `src/app/actions/save-vocab-to-deck-action.ts`

**Modify:**
- `src/app/page.tsx` — real lesson list alongside the Phase 04 form
- `package.json` — `pnpm add react-youtube`

**Delete:** none.

## Implementation Steps

1. `pnpm add react-youtube`.
2. `src/lib/format-timestamp.ts`: `formatTimestamp(sec)` → `M:SS` / `MM:SS`, `H:MM:SS` above an hour. Pure, unit-tested in Phase 08.
3. `lessons/[id]/page.tsx`: the single `findUnique` + `include` above. `notFound()` if missing. If `status !== READY`, render a status panel (generating / failed + retry) instead of tabs — a `FAILED` lesson must not render empty tabs.
4. `lesson-player-provider.tsx`: `"use client"`. `<YouTube videoId onReady={e => playerRef.current = e.target} />`, context value `{ seekTo }` where `seekTo` calls `playerRef.current?.seekTo(sec, true)` then `playVideo()`. No-op when ref is null.
5. `lesson-tabs.tsx`: `"use client"`, shadcn `Tabs`, 4 triggers. Sync active tab to the URL hash (`#script|#grammar|#quiz|#vocab`) so reload/back preserves it, mirroring elllo's anchor tabs.
6. `tab-script.tsx`: map segments to rows — `[MM:SS]` button + `**Speaker**:` + text. Whole row clickable, `cursor-pointer`, visible hover state so the affordance is obvious. Render short turns unchanged. Use semantic `<button>` for keyboard/a11y, not a clickable `<div>`.
7. `tab-grammar.tsx`: theme as heading, then per point: `Point {orderIndex}: {explanation}` bold-prefixed, `<ul>` of the 4 examples. Presentational, no client JS.
8. `tab-quiz.tsx`: the state machine above. Radio-style single-select per question (elllo renders checkboxes, but single-answer semantics = radios are correct; deliberate small deviation for usability). Options labelled a/b/c for elllo parity. After Check: green/red marks + a score line. Show Answers highlights the correct option.
9. `tab-vocabulary.tsx`: card per item (term / meaning / example) + Save button. Disabled + "Saved" when `flashcard` exists. `useTransition` for pending.
10. `save-vocab-to-deck-action.ts`: `"use server"`, creates the `Flashcard` with FSRS initial state via Phase 06's helper. **Ordering note:** if Phase 06 isn't done, use `createEmptyCard()` from `ts-fsrs` directly here and let Phase 06 refactor it behind the helper — do not invent a hand-rolled initial state that later disagrees with the library. Idempotent: if a flashcard already exists for that vocab item, no-op (unique constraint on `vocabItemId` backs this).
11. `page.tsx` home: `db.lesson.findMany({ orderBy:{ createdAt:"desc" }})` + cards using `https://i.ytimg.com/vi/{videoId}/mqdefault.jpg` for thumbnails (no API key needed). Add `images.remotePatterns` for `i.ytimg.com` in `next.config.ts` if using `next/image`.
12. Manual pass on a real ingested lesson: all 4 tabs correct, click 5 different lines and confirm the player jumps to the right moment, quiz check/reset/show all behave, saving a word flips it to "Saved" and survives reload.
13. Confirm zero AI: watch server logs while loading a lesson — no Gemini request should appear.
14. `pnpm typecheck` + `pnpm build`. Commit: `feat: add lesson page with four tabs and player seek`.

## Todo List
- [ ] `pnpm add react-youtube`
- [ ] `format-timestamp.ts`
- [ ] Lesson page single-query fetch + non-READY status panel
- [ ] `lesson-player-provider.tsx` with null-safe seekTo
- [ ] `lesson-tabs.tsx` + hash sync
- [ ] `tab-script.tsx` clickable turns (semantic buttons)
- [ ] `tab-grammar.tsx`
- [ ] `tab-quiz.tsx` check/reset/show state machine
- [ ] `tab-vocabulary.tsx` + save action
- [ ] `save-vocab-to-deck-action.ts` (idempotent)
- [ ] Home list with thumbnails
- [ ] Manual pass: seek accuracy on 5 lines
- [ ] Manual pass: quiz all three buttons
- [ ] Verify ZERO Gemini calls on lesson load
- [ ] `pnpm typecheck` + `pnpm build` green
- [ ] Commit

## Success Criteria
- Lesson page renders in well under a second on repeat visits; server logs show exactly one DB query set and **zero** Gemini calls.
- Clicking a transcript line jumps the player to that moment (verify 5 lines by ear; caption-sourced lessons should be near-exact).
- Grammar tab visually matches the verified elllo layout: theme, 4 numbered points, 4 bullets each.
- Quiz: selecting answers + Check marks correctness; Reset clears; Show Answers reveals — all without a page reload or network call.
- Saving a vocab word persists (survives reload) and cannot double-create.
- A `FAILED` lesson shows a status panel, never empty tabs.
- Tab choice survives a page reload.
- All component files < 200 lines.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Plain `<iframe>` can't be seeked | Med | **High** (kills the headline feature) | Use `react-youtube` / IFrame Player API from the start — called out explicitly here |
| `seekTo` called before player ready | **High** | Med | Null-safe ref + no-op guard (step 4) |
| Gemini timestamps drift → seeks land off | Med | Low | Captions path is exact; ±1–2s on the Gemini path is tolerable for review. Not worth engineering around |
| Component files exceed 200 lines | Med | Low | One file per tab from the outset |
| Accidentally fetching in a Client Component (N+1 / leaks) | Med | Med | Fetch only in the route Server Component; pass plain props down |
| `next/image` blocks ytimg | Med | Low | Add `remotePatterns`, or use a plain `<img>` — thumbnails don't need optimization |
| Quiz answers visible in page source | **High** (certain) | **None** | Single-user self-study app; the user can also press Show Answers. Explicitly a non-issue — do not add a server-check round-trip for it |

## Security Considerations
- All DB access in Server Components / server actions; no DB client or connection string reaches the browser.
- `save-vocab-to-deck-action` must validate that `vocabItemId` exists before insert, and must be behind the Phase 07 password gate.
- Render model-generated text (transcript, grammar, quiz, vocab) as **plain text only**. Never `dangerouslySetInnerHTML` — the content is LLM output and treating it as markup is a stored-XSS path. React's default escaping is the correct behavior here; just don't opt out of it.
- Same for `errorMessage` in the status panel — plain text.
- The whole page is behind the shared password (Phase 07). Until then keep it localhost-only.

## Next Steps
- Unblocks Phase 06 (flashcards need saved vocab, which this page creates).
- Phase 07 wraps all routes in the auth gate.
