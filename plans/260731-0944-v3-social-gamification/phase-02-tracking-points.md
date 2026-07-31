# Phase 02 — Tracking Points API + UI

## Overview

- **Priority:** P1
- **Effort:** 5h
- **Status:** Pending
- **Depends on:** Phase 01 (DB Schema)

Implement h? th?ng tích di?m + streak cho user. Ði?m là n?n t?ng cho Phase 03 (nuôi mèo).

## Requirements

### Functional
- User nh?n di?m khi: h?c bài, quiz, vi?t câu dúng, flashcard review
- Streak tính theo ngày — reset n?u gap > 1 ngày
- Multiplier: streak = 7 ngày ? x2, = 30 ngày ? x3
- Widget header hi?n th? di?m hôm nay + streak
- Drawer m? ra: streak calendar 30 ngày

### Non-functional
- Rate limit `/api/points/award`: 1 req/5s per userId
- Award logic server-side (không trust client)
- API < 200ms response

## Points Rules

| Source | Base Points | Ði?u ki?n |
|--------|-------------|-----------|
| `daily_lesson` | +10 | 1 l?n/ngày/lesson, xem > 30s |
| `quiz_complete` | +5 d?n +15 | `floor(score/5 * 15)` |
| `writing_correct` | +3/câu | Gemini semantic check pass |
| `flashcard_review` | +2/card | due <= now khi review |
| `streak_bonus` | multiplier x2/x3 | Applied AFTER base calc |

## Architecture

### `src/lib/points/award-points.ts`

```typescript
// Input: { userId, source, meta }
// Steps:
// 1. Calc base points t? source + meta
// 2. Load UserStreak — upsert n?u chua có
// 3. Check streak continuity:
//    - today == lastActiveDate ? skip streak update, apply multiplier
//    - yesterday == lastActiveDate ? currentStreak++
//    - else ? currentStreak = 1 (reset)
// 4. Update longestStreak n?u c?n
// 5. Calc multiplier: =30 ? 3, =7 ? 2, else 1
// 6. Insert UserPoint v?i final points = base * multiplier
// 7. Return { points, totalToday, currentStreak, multiplier }
```

### Streak Calendar (UI)

- 30 ô vuông, m?i ô = 1 ngày
- Màu s?c: 0 pts = gray, 1-9 = light green, 10-19 = green, 20+ = dark green
- Flame icon ?? v?i s? ngày streak

## Related Code Files

| File | Action | Mô t? |
|------|--------|--------|
| `src/lib/points/award-points.ts` | Create | Core business logic |
| `src/app/api/points/award/route.ts` | Create | POST — nh?n di?m |
| `src/app/api/points/today/route.ts` | Create | GET — today summary |
| `src/app/api/points/history/route.ts` | Create | GET — 30-day history |
| `src/components/points/points-widget.tsx` | Create | Header badge + drawer |
| `src/components/points/streak-calendar.tsx` | Create | 30-day heatmap |
| `src/app/lessons/[id]/page.tsx` | Modify | Trigger daily_lesson |
| `src/components/lesson/tab-quiz.tsx` | Modify | Trigger quiz_complete |
| `src/components/lesson/tab-writing-practice.tsx` | Modify | Trigger writing_correct |

## Implementation Steps

1. **T?o `src/lib/points/award-points.ts`**
   - Logic streak (upsert UserStreak)
   - Logic multiplier
   - Insert UserPoint
   - Return summary object

2. **T?o `/api/points/award/route.ts`**
   - Authenticate user t? cookie/session
   - Rate limit: header `x-forwarded-for` + userId, max 1/5s
   - Call `awardPoints()`
   - Return `{ points, totalToday, currentStreak, multiplier }`

3. **T?o `/api/points/today/route.ts`**
   - Aggregate `UserPoint` WHERE userId + date = today (UTC)
   - Join `UserStreak`
   - Return `{ totalToday, currentStreak, longestStreak }`

4. **T?o `/api/points/history/route.ts`**
   - Group UserPoint by date, sum points, last 30 days
   - Return array `[{ date, points }]`

5. **T?o `streak-calendar.tsx`**
   - Nh?n `history: { date, points }[]`
   - Render 30 ô vuông v?i màu theo points
   - Tooltip khi hover: "X di?m ngày DD/MM"

6. **T?o `points-widget.tsx`**
   - Fetch `/api/points/today` khi mount
   - Badge: `? {totalToday} pts · ?? {currentStreak} ngày`
   - Click ? Drawer m?, fetch `/api/points/history`, render `<StreakCalendar />`

7. **S?a lesson page** — trigger `daily_lesson` khi:
   - User ? trang lesson > 30 giây
   - Chua có UserPoint cho lesson này hôm nay
   - Dùng `useEffect` + `setTimeout(30000)` ? POST /api/points/award

8. **S?a `tab-quiz.tsx`** — sau khi submit quiz:
   - Tính score (s? câu dúng / 5)
   - POST /api/points/award v?i `{ source: 'quiz_complete', meta: { score } }`

9. **S?a `tab-writing-practice.tsx`** — khi Gemini check tr? v? `isCorrect: true`:
   - POST /api/points/award `{ source: 'writing_correct' }`

10. **Thêm `<PointsWidget />` vào layout header**

11. `npx tsc --noEmit` — zero errors

## Todo

- [ ] `src/lib/points/award-points.ts`
- [ ] `src/app/api/points/award/route.ts` — rate limit + award
- [ ] `src/app/api/points/today/route.ts`
- [ ] `src/app/api/points/history/route.ts`
- [ ] `src/components/points/streak-calendar.tsx`
- [ ] `src/components/points/points-widget.tsx`
- [ ] Lesson page: trigger `daily_lesson` sau 30s
- [ ] `tab-quiz.tsx`: trigger `quiz_complete`
- [ ] `tab-writing-practice.tsx`: trigger `writing_correct`
- [ ] Header layout: mount `<PointsWidget />`
- [ ] `npx tsc --noEmit` — zero errors

## Success Criteria

- User h?c bài ? di?m tang trong widget
- Streak reset n?u b? h?c 1 ngày
- Multiplier hi?n th? dúng (x2, x3)
- Rate limit ho?t d?ng — double-submit không du?c award 2 l?n
- Calendar hi?n th? dúng màu theo di?m

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Timezone bug (date so sánh sai) | Medium | Luôn dùng UTC midnight, truncate v?i `startOfDay(utc)` |
| Double award (race condition) | Medium | Upsert v?i `@@unique` constraint n?u c?n; rate limit |
| Flashcard trigger chua có | Low | Ð? Phase 02 ch? wire lesson/quiz/writing; flashcard là follow-up |

## Security Considerations

- Award ch? t? server-side action, không trust client-sent `points`
- Rate limit theo userId + IP
- Không expose `meta` field ra client (internal only)
