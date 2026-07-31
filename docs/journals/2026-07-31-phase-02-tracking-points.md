# Technical Journal: Phase 02 - Tracking Points API + UI

**Date:** 2026-07-31
**Phase:** 02 - Tracking Points API + UI
**Status:** Completed

## Changes Implemented

1. **Core Business Logic (`src/lib/points/award-points.ts`)**:
   - Implemented `awardPoints({ userId, source, meta })`.
   - Handled base points calculation for `daily_lesson`, `quiz_complete`, `writing_correct`, `flashcard_review`, and `streak_bonus`.
   - Upserted `UserStreak` record:
     - Verified streak continuity against UTC midnight.
     - Incremented streak if active yesterday, maintained if active today, reset to 1 if gap > 1 day.
     - Applied multiplier: `currentStreak >= 30` -> 3x, `>= 7` -> 2x, else 1x.
   - Inserted `UserPoint` record with date normalized to UTC midnight.

2. **API Routes**:
   - `POST /api/points/award`: Enforced rate limit (1 req per 5s per user) and deduplication for `daily_lesson`.
   - `GET /api/points/today`: Returns aggregate points today, current streak, and longest streak.
   - `GET /api/points/history`: Returns array of 30-day point history formatted for heatmap calendar.

3. **UI Components**:
   - `StreakCalendar` (`src/components/points/streak-calendar.tsx`): 30-day square heatmap with color levels (gray, light green, green, dark green).
   - `PointsWidget` (`src/components/points/points-widget.tsx`): Header pill badge displaying today's points, streak flame, multiplier tag, and interactive drawer with 30-day history.
   - `LessonTimeTracker` (`src/components/points/lesson-time-tracker.tsx`): 30-second stay timer for lesson detail page.

4. **Integration**:
   - Mounted `<PointsWidget />` on home page (`src/app/page.tsx`) and lesson page (`src/app/lessons/[id]/page.tsx`).
   - Connected `quiz_complete` trigger in `src/components/lesson/tab-quiz.tsx`.
   - Connected `writing_correct` trigger in `src/components/lesson/tab-writing-practice.tsx`.

## Verification

- `npx tsc --noEmit` executed with 0 errors.
