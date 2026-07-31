# Phase 02 - Tracking Points API + UI

## Overview

- **Priority:** P1
- **Effort:** 5h
- **Status:** Completed
- **Depends on:** Phase 01 (DB Schema)

Hệ thống tích điểm + streak cho user. Điểm là nền tảng cho Phase 03 (nuôi mèo).

## Requirements

### Functional
- User nhận điểm khi: học bài, quiz, viết câu đúng, flashcard review
- Streak tính theo ngày - reset nếu gap > 1 ngày
- Multiplier: streak = 7 ngày -> x2, = 30 ngày -> x3
- Widget header hiển thị điểm hôm nay + streak
- Drawer mở ra: streak calendar 30 ngày

### Non-functional
- Rate limit `/api/points/award`: 1 req/5s per userId
- Award logic server-side (không trust client)
- API < 200ms response

## Points Rules

| Source | Base Points | Điều kiện |
|--------|-------------|-----------|
| `daily_lesson` | +10 | 1 lần/ngày/lesson, xem > 30s |
| `quiz_complete` | +5 đến +15 | `floor(score/5 * 15)` |
| `writing_correct` | +3/câu | Gemini semantic check pass |
| `flashcard_review` | +2/card | due <= now khi review |
| `streak_bonus` | multiplier x2/x3 | Applied AFTER base calc |

## Related Code Files

| File | Action | Mô tả |
|------|--------|--------|
| `src/lib/points/award-points.ts` | Create | Core business logic |
| `src/app/api/points/award/route.ts` | Create | POST - nhận điểm |
| `src/app/api/points/today/route.ts` | Create | GET - today summary |
| `src/app/api/points/history/route.ts` | Create | GET - 30-day history |
| `src/components/points/points-widget.tsx` | Create | Header badge + drawer |
| `src/components/points/streak-calendar.tsx` | Create | 30-day heatmap |
| `src/components/points/lesson-time-tracker.tsx` | Create | Trigger daily_lesson sau 30s |
| `src/app/lessons/[id]/page.tsx` | Modify | Trigger daily_lesson & mount widget |
| `src/components/lesson/tab-quiz.tsx` | Modify | Trigger quiz_complete |
| `src/components/lesson/tab-writing-practice.tsx` | Modify | Trigger writing_correct |
| `src/app/page.tsx` | Modify | Mount PointsWidget ở header |

## Todo

- [x] `src/lib/points/award-points.ts`
- [x] `src/app/api/points/award/route.ts` - rate limit + award
- [x] `src/app/api/points/today/route.ts`
- [x] `src/app/api/points/history/route.ts`
- [x] `src/components/points/streak-calendar.tsx`
- [x] `src/components/points/points-widget.tsx`
- [x] Lesson page: trigger `daily_lesson` sau 30s
- [x] `tab-quiz.tsx`: trigger `quiz_complete`
- [x] `tab-writing-practice.tsx`: trigger `writing_correct`
- [x] Header layout: mount `<PointsWidget />`
- [x] `npx tsc --noEmit` - zero errors
