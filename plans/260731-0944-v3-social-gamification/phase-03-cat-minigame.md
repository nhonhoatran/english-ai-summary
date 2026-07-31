# Phase 03 — Mini Game Nuôi Mèo ??

## Overview

- **Priority:** P2
- **Effort:** 7h
- **Status:** Pending
- **Depends on:** Phase 01 (DB Schema), Phase 02 (Tracking Points)

Mini game nuôi mèo den tr?ng kawaii. Mèo thay d?i tr?ng thái theo thói quen h?c. User dùng di?m tích du?c d? cham mèo.

## Requirements

### Functional
- Mèo có 6 tr?ng thái: `happy`, `playing`, `hungry`, `dirty`, `sleeping`, `sad`
- 4 hành d?ng: Cho an (5 pts), T?m (10 pts), Vu?t ve (free, max 3/ngày), Choi (15 pts)
- Cron job hàng ngày decay các ch? s? n?u không h?c
- Widget floating góc ph?i màn hình
- Modal full mini-game khi click widget

### Non-functional
- Cat visual = CSS art thu?n (không load ?nh PNG)
- M?i state = CSS class + `@keyframes` riêng
- Deduct points TRU?C r?i m?i update cat state
- Cron endpoint ph?i verify `CRON_SECRET`

## Architecture

### State Machine

```
if (22h <= hour < 7h)           ? sleeping
else if (streak = 0 && happiness < 30) ? sad
else if (cleanliness < 30)      ? dirty
else if (hunger > 70)           ? hungry
else if (todayPoints >= 10)     ? happy
else if (user on lesson page)   ? playing
else                            ? hungry
```

### Decay Logic (daily cron 00:00 UTC)

```
hunger += 30
  if (yesterdayPoints === 0) hunger += 20 (total +50)
cleanliness -= 20
  if (cleanliness < 30) cleanliness -= 20 (total -40)
happiness -= 10
  if (streak === 0) happiness -= 10 (total -20)
petCount = 0
Clamp all values [0, 100]
```

### CSS Cat Design (6 states)

Mèo den tr?ng kawaii — CSS art thu?n:
```css
.cat { /* base: body tr?ng, patch den, tai, m?t */ }
.cat.happy { animation: bounce 1s ease infinite; }
.cat.hungry { animation: sway 2s ease infinite; /* m?t _ _ */ }
.cat.dirty { filter: brightness(0.85); /* d?m b?n via box-shadow */ }
.cat.sleeping { animation: breathe 3s ease infinite; /* Zzz float */ }
.cat.sad { animation: droop 2s ease infinite; /* gi?t nu?c */ }
.cat.playing { animation: jump 0.8s ease infinite; }
```

## Related Code Files

| File | Action | Mô t? |
|------|--------|--------|
| `src/lib/cat/compute-cat-mood.ts` | Create | Pure function: state ? mood |
| `src/app/api/cat/route.ts` | Create | GET state + computed mood |
| `src/app/api/cat/feed/route.ts` | Create | POST — cho an |
| `src/app/api/cat/bath/route.ts` | Create | POST — t?m mèo |
| `src/app/api/cat/pet/route.ts` | Create | POST — vu?t ve (free) |
| `src/app/api/cat/play/route.ts` | Create | POST — choi |
| `src/app/api/cron/cat-decay/route.ts` | Create | POST — daily decay |
| `src/components/cat/cat-sprite.tsx` | Create | CSS animated cat |
| `src/components/cat/cat-widget.tsx` | Create | Floating widget 80px |
| `src/components/cat/cat-game-modal.tsx` | Create | Full modal mini-game |
| `vercel.json` | Modify | Thêm cron schedule |

## Implementation Steps

1. **`compute-cat-mood.ts`** — pure function, không có side effects
   ```typescript
   export function computeCatMood(params: {
     cat: CatState
     todayPoints: number
     hour: number     // 0-23 local
     streak: number
     isOnLessonPage: boolean
   }): 'happy' | 'playing' | 'hungry' | 'dirty' | 'sleeping' | 'sad'
   ```

2. **`GET /api/cat`** — tr? v? full state + computed mood
   - Load CatState (upsert default n?u chua có)
   - Load todayPoints + streak t? UserPoint/UserStreak
   - G?i `computeCatMood()`
   - Return `{ catState, mood, todayPoints, pointsBalance }`

3. **Action APIs** — pattern chung:
   ```
   POST /api/cat/[action]
   1. Load CatState
   2. Check di?u ki?n (d? di?m, petCount < 3...)
   3. Deduct points (g?i internal awardPoints v?i negative value)
   4. Update CatState
   5. Return updated state + new mood
   ```

4. **`/api/cron/cat-decay`**
   - Verify: `request.headers.get('authorization') === 'Bearer ' + CRON_SECRET`
   - Apply decay cho T?T C? users (batch update)
   - Clamp values [0, 100]

5. **`cat-sprite.tsx`**
   - Pure CSS cat illustration
   - Props: `{ mood: CatMood; size?: number }`
   - Mèo den tr?ng: body tròn (white + black patch), tai nh?n, duôi cong
   - 6 animation classes tuong ?ng 6 moods

6. **`cat-widget.tsx`**
   - Floating div: `position: fixed; bottom: 24px; right: 24px`
   - Size: 80x80px + 3 mini status bars bên du?i
   - Fetch `/api/cat` khi mount, re-fetch m?i 60s
   - Click ? m? `<CatGameModal />`

7. **`cat-game-modal.tsx`**
   - Modal dialog
   - `<CatSprite size={200} mood={mood} />`
   - Tên mèo: "Mochi" (c? d?nh)
   - Status bars: ?? {happiness}% | ?? {hunger}% | ?? {cleanliness}%
   - 4 nút action v?i cost hi?n th?
   - "B?n có X ?" — di?m hi?n t?i
   - Nút disabled + tooltip n?u không d? di?m

8. **`vercel.json`**
   ```json
   {
     "crons": [{
       "path": "/api/cron/cat-decay",
       "schedule": "0 0 * * *"
     }]
   }
   ```

9. **Thêm `<CatWidget />` vào layout** (fixed position, không ?nh hu?ng layout)

10. `.env` — thêm `CRON_SECRET=<random-uuid>`

11. `npx tsc --noEmit` — zero errors

## Todo

- [ ] `src/lib/cat/compute-cat-mood.ts` — pure function
- [ ] `src/app/api/cat/route.ts` — GET state + mood
- [ ] `src/app/api/cat/feed/route.ts` — deduct 5 pts
- [ ] `src/app/api/cat/bath/route.ts` — deduct 10 pts
- [ ] `src/app/api/cat/pet/route.ts` — free, max 3/day
- [ ] `src/app/api/cat/play/route.ts` — deduct 15 pts
- [ ] `src/app/api/cron/cat-decay/route.ts` — batch decay
- [ ] `src/components/cat/cat-sprite.tsx` — CSS art 6 states
- [ ] `src/components/cat/cat-widget.tsx` — floating 80px
- [ ] `src/components/cat/cat-game-modal.tsx` — full modal
- [ ] `vercel.json` — cron schedule
- [ ] `.env` — thêm `CRON_SECRET`
- [ ] Layout: mount `<CatWidget />`
- [ ] `npx tsc --noEmit` — zero errors

## Success Criteria

- Mèo d?i state khi user h?c / không h?c
- Cho an tr? dúng 5 di?m và hunger gi?m
- Vu?t ve b? ch?n sau 3 l?n/ngày
- Cron decay ch?y dúng (test v?i manual POST + CRON_SECRET)
- CSS animation mu?t, không flicker
- Widget không che n?i dung chính (z-index dúng)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| CSS cat trông x?u / không nh?n ra là mèo | Medium | Test early, có th? dùng emoji ?? làm fallback base |
| Timezone decay sai gi? | Medium | Cron UTC 00:00 = 7h sáng VN, ph?i tính theo UTC day |
| Race condition deduct + update | Low | Sequential: deduct FIRST, then update state |
| Cron CRON_SECRET leak | Low | Dùng env var, không hardcode, verify trong handler |

## Security Considerations

- Cron endpoint: `if (!secret) return 401` — TRU?C khi x? lý
- Deduct points: verify userId t? session, không t? body
- petCount check server-side, không trust client
